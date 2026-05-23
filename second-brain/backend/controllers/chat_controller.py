from fastapi import APIRouter, Depends, status
from fastapi.responses import Response

from dtos.chat_dto import ChatRequest, ChatResponse, SpeechRequest
from enums.RoutesTagEnum import RoutesTagEnum
from services.ai_chat_service import AiChatService

chat_controller = APIRouter(prefix="/ai", tags=[RoutesTagEnum.AI.value])


@chat_controller.post("/chat", response_model=ChatResponse, status_code=status.HTTP_200_OK)
def chat(
    data: ChatRequest,
    service: AiChatService = Depends(AiChatService),
):
    return service.chat(data)


@chat_controller.post("/speech", status_code=status.HTTP_200_OK)
def speech(
    data: SpeechRequest,
    service: AiChatService = Depends(AiChatService),
):
    audio = service.speech(data.text)
    return Response(content=audio, media_type="audio/mpeg")
