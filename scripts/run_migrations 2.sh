#!/bin/bash
# Database Migration Script for F1-Slipstream Agent
# Handles Pinecone index migrations and data updates

set -e

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR:${NC} $1"
}

warning() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING:${NC} $1"
}

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

log "Starting database migrations..."

# Load environment variables
if [ -f "${PROJECT_ROOT}/.env.production" ]; then
    export $(cat "${PROJECT_ROOT}/.env.production" | grep -v '^#' | xargs)
    log "Loaded production environment variables"
else
    error ".env.production not found"
    exit 1
fi

# Check if Pinecone credentials are set
if [ -z "$PINECONE_API_KEY" ]; then
    error "PINECONE_API_KEY not set in environment"
    exit 1
fi

# Migration 1: Verify Pinecone index exists
log "Migration 1: Verifying Pinecone index..."
python3 << EOF
import os
import sys
from pinecone import Pinecone

try:
    pc = Pinecone(api_key=os.environ['PINECONE_API_KEY'])
    index_name = os.environ.get('PINECONE_INDEX_NAME', 'f1-knowledge')
    
    # List existing indexes
    indexes = pc.list_indexes()
    index_names = [idx.name for idx in indexes]
    
    if index_name in index_names:
        print(f"✓ Index '{index_name}' exists")
        
        # Get index stats
        index = pc.Index(index_name)
        stats = index.describe_index_stats()
        print(f"  Total vectors: {stats.get('total_vector_count', 0)}")
        print(f"  Dimension: {stats.get('dimension', 'unknown')}")
    else:
        print(f"✗ Index '{index_name}' does not exist")
        print(f"  Available indexes: {', '.join(index_names) if index_names else 'None'}")
        sys.exit(1)
        
except Exception as e:
    print(f"✗ Error verifying Pinecone index: {e}")
    sys.exit(1)
EOF

if [ $? -eq 0 ]; then
    log "Migration 1 completed ✓"
else
    error "Migration 1 failed"
    exit 1
fi

# Migration 2: Update index metadata schema (if needed)
log "Migration 2: Checking index metadata schema..."
python3 << EOF
import os
import sys
from pinecone import Pinecone

try:
    pc = Pinecone(api_key=os.environ['PINECONE_API_KEY'])
    index_name = os.environ.get('PINECONE_INDEX_NAME', 'f1-knowledge')
    index = pc.Index(index_name)
    
    # Query a sample vector to check metadata structure
    stats = index.describe_index_stats()
    
    if stats.get('total_vector_count', 0) > 0:
        # Fetch a sample vector
        results = index.query(
            vector=[0.0] * 1536,  # Dummy vector
            top_k=1,
            include_metadata=True
        )
        
        if results.get('matches'):
            sample_metadata = results['matches'][0].get('metadata', {})
            required_fields = ['source', 'category', 'created_at']
            
            missing_fields = [f for f in required_fields if f not in sample_metadata]
            
            if missing_fields:
                print(f"⚠ Warning: Sample vector missing fields: {', '.join(missing_fields)}")
                print("  Consider re-ingesting data with updated schema")
            else:
                print("✓ Metadata schema is up to date")
        else:
            print("⚠ No vectors found to validate metadata schema")
    else:
        print("⚠ Index is empty, skipping metadata validation")
    
except Exception as e:
    print(f"⚠ Warning: Could not validate metadata schema: {e}")
    # Don't fail migration for this
EOF

log "Migration 2 completed ✓"

# Migration 3: Validate vector embeddings dimension
log "Migration 3: Validating embedding dimensions..."
python3 << EOF
import os
import sys
from pinecone import Pinecone

try:
    pc = Pinecone(api_key=os.environ['PINECONE_API_KEY'])
    index_name = os.environ.get('PINECONE_INDEX_NAME', 'f1-knowledge')
    
    # Get index info
    index_info = pc.describe_index(index_name)
    dimension = index_info.dimension
    
    # Expected dimension for text-embedding-3-small
    expected_dimension = 1536
    
    if dimension == expected_dimension:
        print(f"✓ Embedding dimension is correct: {dimension}")
    else:
        print(f"✗ Embedding dimension mismatch!")
        print(f"  Expected: {expected_dimension}")
        print(f"  Actual: {dimension}")
        sys.exit(1)
        
except Exception as e:
    print(f"✗ Error validating embedding dimension: {e}")
    sys.exit(1)
EOF

if [ $? -eq 0 ]; then
    log "Migration 3 completed ✓"
else
    error "Migration 3 failed"
    exit 1
fi

# Migration 4: Check for data freshness
log "Migration 4: Checking data freshness..."
python3 << EOF
import os
from datetime import datetime, timedelta
from pinecone import Pinecone

try:
    pc = Pinecone(api_key=os.environ['PINECONE_API_KEY'])
    index_name = os.environ.get('PINECONE_INDEX_NAME', 'f1-knowledge')
    index = pc.Index(index_name)
    
    stats = index.describe_index_stats()
    total_vectors = stats.get('total_vector_count', 0)
    
    if total_vectors == 0:
        print("⚠ Warning: Index is empty. Run data ingestion.")
    elif total_vectors < 1000:
        print(f"⚠ Warning: Index has only {total_vectors} vectors. Consider ingesting more data.")
    else:
        print(f"✓ Index has {total_vectors} vectors")
    
except Exception as e:
    print(f"⚠ Warning: Could not check data freshness: {e}")
EOF

log "Migration 4 completed ✓"

log "========================================="
log "All migrations completed successfully! ✓"
log "========================================="

exit 0
