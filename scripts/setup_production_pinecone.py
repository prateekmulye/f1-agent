#!/usr/bin/env python3
"""
Setup Production Pinecone Index for F1-Slipstream
Creates and configures a free-tier Pinecone index
"""

import os
import sys
from typing import Optional

try:
    from pinecone import Pinecone, ServerlessSpec
except ImportError:
    print("Error: pinecone-client not installed")
    print("Install with: pip install pinecone-client")
    sys.exit(1)


def setup_pinecone_index(
    api_key: str,
    index_name: str = "f1-knowledge-free",
    dimension: int = 1536,
    metric: str = "cosine",
    cloud: str = "aws",
    region: str = "us-east-1"
) -> bool:
    """
    Setup Pinecone index for production use
    
    Args:
        api_key: Pinecone API key
        index_name: Name of the index to create
        dimension: Vector dimension (1536 for text-embedding-3-small)
        metric: Distance metric (cosine, euclidean, dotproduct)
        cloud: Cloud provider (aws, gcp, azure)
        region: Cloud region
        
    Returns:
        True if successful, False otherwise
    """
    try:
        print("🔧 Initializing Pinecone client...")
        pc = Pinecone(api_key=api_key)
        
        # List existing indexes
        print("📋 Checking existing indexes...")
        indexes = pc.list_indexes()
        index_names = [idx.name for idx in indexes]
        
        print(f"   Found {len(index_names)} existing index(es)")
        for idx_name in index_names:
            print(f"   - {idx_name}")
        
        # Check if index already exists
        if index_name in index_names:
            print(f"\n✅ Index '{index_name}' already exists")
            
            # Get index stats
            index = pc.Index(index_name)
            stats = index.describe_index_stats()
            
            print(f"\n📊 Index Statistics:")
            print(f"   Total vectors: {stats.get('total_vector_count', 0):,}")
            print(f"   Dimension: {stats.get('dimension', 'unknown')}")
            print(f"   Index fullness: {stats.get('index_fullness', 0):.2%}")
            
            # Check if we're approaching free tier limit (100K vectors)
            vector_count = stats.get('total_vector_count', 0)
            if vector_count > 80000:
                print(f"\n⚠️  WARNING: Approaching free tier limit!")
                print(f"   Current: {vector_count:,} / 100,000 vectors")
                print(f"   Consider cleaning up old vectors")
            
            return True
        
        # Create new index
        print(f"\n🚀 Creating new index '{index_name}'...")
        print(f"   Dimension: {dimension}")
        print(f"   Metric: {metric}")
        print(f"   Cloud: {cloud}")
        print(f"   Region: {region}")
        
        pc.create_index(
            name=index_name,
            dimension=dimension,
            metric=metric,
            spec=ServerlessSpec(
                cloud=cloud,
                region=region
            )
        )
        
        print(f"\n✅ Index '{index_name}' created successfully!")
        print(f"\n📝 Next Steps:")
        print(f"   1. Ingest your F1 knowledge base data")
        print(f"   2. Run: python -m src.ingestion.cli")
        print(f"   3. Monitor usage at: https://app.pinecone.io")
        
        print(f"\n💡 Free Tier Limits:")
        print(f"   - 1 index")
        print(f"   - 100,000 vectors")
        print(f"   - 2M queries/month")
        
        return True
        
    except Exception as e:
        print(f"\n❌ Error setting up Pinecone index: {e}")
        return False


def validate_environment() -> tuple[Optional[str], Optional[str]]:
    """
    Validate required environment variables
    
    Returns:
        Tuple of (api_key, index_name) or (None, None) if invalid
    """
    api_key = os.getenv("PINECONE_API_KEY")
    if not api_key:
        print("❌ Error: PINECONE_API_KEY environment variable not set")
        print("\nSet it with:")
        print("  export PINECONE_API_KEY='your-api-key'")
        return None, None
    
    index_name = os.getenv("PINECONE_INDEX_NAME", "f1-knowledge-free")
    
    return api_key, index_name


def main():
    """Main entry point"""
    print("=" * 60)
    print("F1-Slipstream Pinecone Setup")
    print("=" * 60)
    print()
    
    # Validate environment
    api_key, index_name = validate_environment()
    if not api_key:
        sys.exit(1)
    
    print(f"🎯 Target index: {index_name}")
    print()
    
    # Setup index
    success = setup_pinecone_index(api_key, index_name)
    
    if success:
        print("\n" + "=" * 60)
        print("✅ Setup completed successfully!")
        print("=" * 60)
        sys.exit(0)
    else:
        print("\n" + "=" * 60)
        print("❌ Setup failed")
        print("=" * 60)
        sys.exit(1)


if __name__ == "__main__":
    main()
