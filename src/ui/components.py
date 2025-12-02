"""Reusable UI components for F1-Slipstream Streamlit app.

This module provides components for:
- Message display with role-based styling
- Source citations and metadata
- Feedback mechanisms
- Loading indicators
"""

from datetime import datetime
from typing import Any, Optional

import streamlit as st
import structlog

logger = structlog.get_logger(__name__)


def render_message(
    role: str,
    content: str,
    metadata: Optional[dict[str, Any]] = None,
    message_id: Optional[str] = None,
) -> None:
    """Render a chat message with role-based styling.

    Args:
        role: Message role ("user" or "assistant")
        content: Message content (supports markdown)
        metadata: Optional metadata (sources, confidence, etc.)
        message_id: Optional unique message ID for feedback tracking
    """
    with st.chat_message(role):
        # Render main content with markdown support
        st.markdown(content)

        # Render metadata if present
        if metadata and role == "assistant":
            render_message_metadata(metadata, message_id)


def render_message_metadata(
    metadata: dict[str, Any],
    message_id: Optional[str] = None,
) -> None:
    """Render metadata section for assistant messages.

    Args:
        metadata: Message metadata dictionary
        message_id: Optional message ID for feedback
    """
    # Create columns for metadata and feedback
    col1, col2 = st.columns([4, 1])

    with col1:
        # Show sources if available
        if "sources" in metadata and metadata["sources"]:
            render_sources(metadata["sources"])

        # Show confidence if available
        if "confidence" in metadata:
            render_confidence(metadata["confidence"])

        # Show warnings if present
        if "warnings" in metadata and metadata["warnings"]:
            for warning in metadata["warnings"]:
                st.warning(warning, icon="⚠️")

    with col2:
        # Render feedback buttons
        if message_id:
            render_feedback_buttons(message_id)


def render_sources(sources: list[dict[str, Any]]) -> None:
    """Render expandable source citations.

    Args:
        sources: List of source dictionaries with content, url, title, etc.
    """
    with st.expander(f"📚 Sources ({len(sources)})", expanded=False):
        for i, source in enumerate(sources, 1):
            source_type = source.get("type", "unknown")

            # Different styling for different source types
            if source_type == "historical":
                icon = "📖"
                label = "Historical Context"
            elif source_type == "current":
                icon = "🔍"
                label = "Current Information"
            else:
                icon = "📄"
                label = "Source"

            st.markdown(f"**{icon} {label} {i}**")

            # Show title if available
            if "title" in source and source["title"]:
                st.markdown(f"*{source['title']}*")

            # Show URL if available
            if "url" in source and source["url"]:
                st.markdown(f"🔗 [{source['url']}]({source['url']})")

            # Show content preview
            content = source.get("content", "")
            if content:
                preview = content[:200] + "..." if len(content) > 200 else content
                st.text(preview)

            # Show score if available
            if "score" in source:
                score = source["score"]
                st.progress(score, text=f"Relevance: {score:.2%}")

            if i < len(sources):
                st.divider()


def render_confidence(confidence: float) -> None:
    """Render confidence score indicator.

    Args:
        confidence: Confidence score (0.0 to 1.0)
    """
    # Determine color based on confidence level
    if confidence >= 0.8:
        color = "green"
        label = "High Confidence"
    elif confidence >= 0.5:
        color = "orange"
        label = "Medium Confidence"
    else:
        color = "red"
        label = "Low Confidence"

    st.markdown(
        f"**Confidence:** :{color}[{label}] ({confidence:.0%})",
        help="Confidence level in the prediction or analysis",
    )


def render_feedback_buttons(message_id: str) -> None:
    """Render thumbs up/down feedback buttons.

    Args:
        message_id: Unique message identifier
    """
    # Check if feedback already given
    feedback_key = f"feedback_{message_id}"
    current_feedback = st.session_state.feedback.get(message_id)

    col1, col2 = st.columns(2)

    with col1:
        if st.button(
            "👍",
            key=f"thumbs_up_{message_id}",
            disabled=current_feedback == "up",
            use_container_width=True,
        ):
            st.session_state.feedback[message_id] = "up"
            logger.info(
                "feedback_received",
                message_id=message_id,
                feedback="positive",
            )
            st.rerun()

    with col2:
        if st.button(
            "👎",
            key=f"thumbs_down_{message_id}",
            disabled=current_feedback == "down",
            use_container_width=True,
        ):
            st.session_state.feedback[message_id] = "down"
            logger.info(
                "feedback_received",
                message_id=message_id,
                feedback="negative",
            )
            st.rerun()

    # Show feedback confirmation
    if current_feedback:
        emoji = "👍" if current_feedback == "up" else "👎"
        st.caption(f"{emoji} Feedback recorded")


def render_typing_indicator() -> None:
    """Render a typing indicator for streaming responses."""
    with st.chat_message("assistant"):
        with st.spinner("Thinking..."):
            st.empty()


def render_error_message(error: str, show_details: bool = False) -> None:
    """Render user-friendly error message.

    Args:
        error: Error message or exception string
        show_details: Whether to show technical details
    """
    # Map common errors to user-friendly messages
    user_friendly_errors = {
        "rate_limit": "⏱️ We're experiencing high demand. Please try again in a moment.",
        "api_key": "🔑 There's a configuration issue. Please contact support.",
        "network": "🌐 Connection issue detected. Please check your internet connection.",
        "timeout": "⏰ The request took too long. Please try a simpler question.",
        "vector_store": "📚 Knowledge base temporarily unavailable. Responses may be limited.",
        "search": "🔍 Search service temporarily unavailable. Using cached knowledge only.",
    }

    # Try to match error to friendly message
    friendly_msg = None
    for key, msg in user_friendly_errors.items():
        if key in error.lower():
            friendly_msg = msg
            break

    if friendly_msg:
        st.error(friendly_msg)
    else:
        st.error("⚠️ Something went wrong. Please try again.")

    # Show technical details in expander if requested
    if show_details:
        with st.expander("Technical Details"):
            st.code(error)


def render_loading_state(message: str = "Processing your request...") -> None:
    """Render loading state with progress indicator.

    Args:
        message: Loading message to display
    """
    with st.status(message, expanded=True) as status:
        st.write("🔍 Analyzing your question...")
        st.write("📚 Searching knowledge base...")
        st.write("🌐 Fetching latest information...")
        st.write("🤖 Generating response...")
        status.update(label="Complete!", state="complete")


def render_welcome_message() -> None:
    """Render welcome message for new conversations."""
    st.markdown(
        """
    ### Welcome to ChatFormula1! 🏎️
    
    I'm your AI-powered Formula 1 expert assistant. I can help you with:
    
    - 📊 **Current Standings**: Latest driver and constructor standings
    - 🏁 **Race Results**: Recent and historical race outcomes
    - 📈 **Predictions**: Data-driven race and championship predictions
    - 📚 **History**: F1 statistics, records, and historical information
    - ⚙️ **Technical**: Regulations, car specifications, and technical details
    - 👤 **Drivers & Teams**: Information about drivers, teams, and personnel
    
    **Try asking:**
    - "Who is leading the championship?"
    - "What happened in the last race?"
    - "Predict the winner of the next race"
    - "Tell me about Lewis Hamilton's career"
    - "What are the current technical regulations?"
    
    Just type your question below to get started! 🚀
    """
    )


def render_input_validation_error(error_type: str) -> None:
    """Render input validation error message.

    Args:
        error_type: Type of validation error
    """
    errors = {
        "empty": "⚠️ Please enter a question.",
        "too_long": "⚠️ Your question is too long. Please keep it under 500 characters.",
        "invalid": "⚠️ Invalid input. Please try again.",
    }

    message = errors.get(error_type, "⚠️ Invalid input.")
    st.warning(message)


def format_timestamp(dt: datetime) -> str:
    """Format datetime for display.

    Args:
        dt: Datetime object

    Returns:
        Formatted timestamp string
    """
    now = datetime.now()
    diff = now - dt

    if diff.seconds < 60:
        return "Just now"
    elif diff.seconds < 3600:
        minutes = diff.seconds // 60
        return f"{minutes} minute{'s' if minutes != 1 else ''} ago"
    elif diff.days == 0:
        hours = diff.seconds // 3600
        return f"{hours} hour{'s' if hours != 1 else ''} ago"
    elif diff.days == 1:
        return "Yesterday"
    elif diff.days < 7:
        return f"{diff.days} days ago"
    else:
        return dt.strftime("%b %d, %Y")


def render_session_info() -> None:
    """Render session information in sidebar."""
    st.sidebar.divider()
    st.sidebar.subheader("📊 Session Stats")

    # Message count
    msg_count = len(st.session_state.messages)
    st.sidebar.metric("Messages", msg_count)

    # Feedback stats
    feedback = st.session_state.feedback
    positive = sum(1 for f in feedback.values() if f == "up")
    negative = sum(1 for f in feedback.values() if f == "down")

    col1, col2 = st.sidebar.columns(2)
    col1.metric("👍", positive)
    col2.metric("👎", negative)

    # Session duration
    if "session_start" in st.session_state:
        duration = datetime.now() - st.session_state.session_start
        minutes = duration.seconds // 60
        st.sidebar.metric("Duration", f"{minutes} min")
