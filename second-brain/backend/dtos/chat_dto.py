from pydantic import BaseModel, Field


class ChatMessage(BaseModel):
    role: str = Field(pattern="^(user|assistant|system)$")
    content: str = Field(min_length=1, max_length=12000)


class ChatRequest(BaseModel):
    message: str = Field(min_length=1, max_length=12000)
    history: list[ChatMessage] = Field(default_factory=list, max_length=20)


class ChatArtifact(BaseModel):
    title: str = Field(min_length=1, max_length=160)
    filename: str = Field(min_length=1, max_length=180)
    content_type: str = Field(min_length=1, max_length=120)
    content: str = Field(min_length=1, max_length=50000)


class ChatResponse(BaseModel):
    message: str
    model: str
    artifacts: list[ChatArtifact] = Field(default_factory=list, max_length=3)


class SpeechRequest(BaseModel):
    text: str = Field(min_length=1, max_length=12000)
