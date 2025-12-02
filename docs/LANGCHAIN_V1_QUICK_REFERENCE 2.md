# LangChain v1.x & LangGraph v1.x Quick Reference

## Package Versions

```toml
langchain = "^1.1.0"
langchain-core = "^1.0.0"
langchain-classic = "^1.0.0"
langgraph = "^1.0.4"
langchain-openai = "^1.1.0"
langchain-pinecone = "^0.2.13"
langchain-tavily = "^0.2.13"
langchain-community = "^1.0.0"
langchain-text-splitters = "^1.0.0"
```

## Common Imports

```python
# Core
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_core.messages import HumanMessage, AIMessage, SystemMessage
from langchain_core.documents import Document
from langchain_core.tools import tool
from langchain_core.output_parsers import StrOutputParser

# LLMs
from langchain_openai import ChatOpenAI, OpenAIEmbeddings

# Vector Stores
from langchain_pinecone import PineconeVectorStore

# Search
from langchain_tavily import TavilySearchResults

# Text Splitting
from langchain_text_splitters import RecursiveCharacterTextSplitter

# LangGraph
from langgraph.graph import StateGraph, END, START
from langgraph.checkpoint.memory import MemorySaver
```

## Chat Models

```python
from langchain_openai import ChatOpenAI

# Basic usage
llm = ChatOpenAI(
    model="gpt-4o",
    temperature=0.7,
    streaming=True
)

# Invoke
response = llm.invoke([
    SystemMessage(content="You are a helpful assistant."),
    HumanMessage(content="Hello!")
])

# Stream
for chunk in llm.stream(messages):
    print(chunk.content, end="", flush=True)

# Async stream
async for chunk in llm.astream(messages):
    print(chunk.content, end="", flush=True)
```

## Prompts

```python
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder

# Simple prompt
prompt = ChatPromptTemplate.from_messages([
    ("system", "You are a helpful assistant."),
    ("human", "{input}")
])

# With chat history
prompt = ChatPromptTemplate.from_messages([
    ("system", "You are a helpful assistant."),
    MessagesPlaceholder(variable_name="chat_history"),
    ("human", "{input}")
])

# Use prompt
chain = prompt | llm
response = chain.invoke({"input": "Hello!", "chat_history": []})
```

## Vector Stores

```python
from langchain_pinecone import PineconeVectorStore
from langchain_openai import OpenAIEmbeddings

# Initialize embeddings
embeddings = OpenAIEmbeddings(model="text-embedding-3-small")

# Create vector store
vector_store = PineconeVectorStore(
    index_name="my-index",
    embedding=embeddings
)

# Add documents
ids = vector_store.add_documents([
    Document(page_content="Text", metadata={"key": "value"})
])

# Search
results = vector_store.similarity_search(
    query="search query",
    k=5,
    filter={"key": "value"}  # Optional metadata filter
)

# Search with scores
results = vector_store.similarity_search_with_score(
    query="search query",
    k=5
)
```

## LangGraph

```python
from typing import TypedDict, List
from langgraph.graph import StateGraph, END, START
from langgraph.checkpoint.memory import MemorySaver
from langchain_core.messages import BaseMessage

# Define state
class AgentState(TypedDict):
    messages: List[BaseMessage]
    query: str
    context: str

# Create graph
graph = StateGraph(AgentState)

# Add nodes
def my_node(state: AgentState) -> AgentState:
    # Process state
    return {"messages": state["messages"] + [new_message]}

graph.add_node("my_node", my_node)

# Add edges
graph.add_edge(START, "my_node")
graph.add_edge("my_node", END)

# Compile with checkpointing
checkpointer = MemorySaver()
app = graph.compile(checkpointer=checkpointer)

# Run
result = app.invoke(
    {"messages": [], "query": "test"},
    config={"configurable": {"thread_id": "1"}}
)
```

## Tools

```python
from langchain_core.tools import tool

@tool
def search_tool(query: str) -> str:
    """Search for information.
    
    Args:
        query: The search query
        
    Returns:
        Search results
    """
    # Implementation
    return results

# Use with agent
tools = [search_tool]
llm_with_tools = llm.bind_tools(tools)
```

## Chains

```python
from langchain_core.output_parsers import StrOutputParser

# Simple chain
chain = prompt | llm | StrOutputParser()

# Invoke
result = chain.invoke({"input": "Hello!"})

# Stream
for chunk in chain.stream({"input": "Hello!"}):
    print(chunk, end="", flush=True)

# Async
result = await chain.ainvoke({"input": "Hello!"})
```

## Text Splitting

```python
from langchain_text_splitters import RecursiveCharacterTextSplitter

splitter = RecursiveCharacterTextSplitter(
    chunk_size=1000,
    chunk_overlap=200,
    separators=["\n\n", "\n", " ", ""]
)

# Split text
chunks = splitter.split_text(long_text)

# Split documents
docs = splitter.split_documents([
    Document(page_content="Long text...")
])
```

## Search

```python
from langchain_tavily import TavilySearchResults

search = TavilySearchResults(
    max_results=5,
    search_depth="advanced"
)

# Search
results = search.invoke("F1 latest news")
```

## Streaming Events

```python
# Detailed streaming with events
async for event in llm.astream_events(messages, version="v2"):
    kind = event["event"]
    
    if kind == "on_chat_model_start":
        print("Starting generation...")
    
    elif kind == "on_chat_model_stream":
        chunk = event["data"]["chunk"]
        print(chunk.content, end="", flush=True)
    
    elif kind == "on_chat_model_end":
        print("\nGeneration complete!")
```

## Error Handling

```python
from langchain_core.exceptions import LangChainException

try:
    result = llm.invoke(messages)
except LangChainException as e:
    print(f"LangChain error: {e}")
except Exception as e:
    print(f"Unexpected error: {e}")
```

## Async Patterns

```python
import asyncio

# Async invoke
result = await llm.ainvoke(messages)

# Async batch
results = await llm.abatch([messages1, messages2])

# Async stream
async for chunk in llm.astream(messages):
    print(chunk.content, end="", flush=True)

# Gather multiple async operations
results = await asyncio.gather(
    llm.ainvoke(messages1),
    llm.ainvoke(messages2),
    vector_store.asimilarity_search(query)
)
```

## Configuration

```python
from langchain_core.runnables import RunnableConfig

# Create config
config = RunnableConfig(
    tags=["my-tag"],
    metadata={"user_id": "123"},
    callbacks=[my_callback]
)

# Use config
result = chain.invoke(input_data, config=config)
```

## Callbacks

```python
from langchain_core.callbacks import BaseCallbackHandler

class MyCallback(BaseCallbackHandler):
    def on_llm_start(self, serialized, prompts, **kwargs):
        print("LLM started")
    
    def on_llm_end(self, response, **kwargs):
        print("LLM ended")
    
    def on_llm_error(self, error, **kwargs):
        print(f"LLM error: {error}")

# Use callback
result = llm.invoke(messages, callbacks=[MyCallback()])
```

## Memory

```python
from langchain_core.messages import HumanMessage, AIMessage

# Simple message history
chat_history = [
    HumanMessage(content="Hello!"),
    AIMessage(content="Hi! How can I help?"),
    HumanMessage(content="What's the weather?")
]

# Use with prompt
prompt = ChatPromptTemplate.from_messages([
    ("system", "You are a helpful assistant."),
    MessagesPlaceholder(variable_name="chat_history"),
    ("human", "{input}")
])

chain = prompt | llm
result = chain.invoke({
    "input": "Tell me more",
    "chat_history": chat_history
})
```

## Best Practices

### 1. Use Type Hints
```python
from typing import List
from langchain_core.messages import BaseMessage

def process_messages(messages: List[BaseMessage]) -> str:
    return "result"
```

### 2. Handle Errors Gracefully
```python
try:
    result = llm.invoke(messages)
except Exception as e:
    logger.error(f"LLM error: {e}")
    result = fallback_response
```

### 3. Use Async for Performance
```python
# Good - parallel execution
results = await asyncio.gather(
    llm.ainvoke(messages1),
    llm.ainvoke(messages2)
)

# Bad - sequential execution
result1 = await llm.ainvoke(messages1)
result2 = await llm.ainvoke(messages2)
```

### 4. Stream for Better UX
```python
# Stream responses for real-time feedback
async for chunk in llm.astream(messages):
    yield chunk.content
```

### 5. Use Proper State Management
```python
# LangGraph state should be immutable
def node(state: AgentState) -> AgentState:
    # Return new state, don't modify in place
    return {**state, "new_field": "value"}
```

## Common Patterns

### RAG Pattern
```python
# Retrieve
docs = vector_store.similarity_search(query, k=5)

# Format context
context = "\n\n".join([doc.page_content for doc in docs])

# Generate
prompt = ChatPromptTemplate.from_messages([
    ("system", "Answer based on context: {context}"),
    ("human", "{question}")
])

chain = prompt | llm | StrOutputParser()
answer = chain.invoke({"context": context, "question": query})
```

### Agent Pattern
```python
from langgraph.prebuilt import create_react_agent

# Create agent with tools
agent = create_react_agent(
    llm,
    tools=[search_tool, calculator_tool],
    checkpointer=MemorySaver()
)

# Run agent
result = agent.invoke(
    {"messages": [HumanMessage(content="Search for F1 news")]},
    config={"configurable": {"thread_id": "1"}}
)
```

### Streaming RAG Pattern
```python
async def streaming_rag(query: str):
    # Retrieve
    docs = await vector_store.asimilarity_search(query, k=5)
    context = "\n\n".join([doc.page_content for doc in docs])
    
    # Stream response
    prompt = ChatPromptTemplate.from_messages([
        ("system", "Answer based on: {context}"),
        ("human", "{question}")
    ])
    
    chain = prompt | llm
    
    async for chunk in chain.astream({
        "context": context,
        "question": query
    }):
        yield chunk.content
```

---

**Quick Reference for LangChain v1.1.0 & LangGraph v1.0.4**  
**Last Updated**: December 1, 2024
