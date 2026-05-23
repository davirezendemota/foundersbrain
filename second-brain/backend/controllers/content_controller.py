from fastapi import APIRouter, Depends, status

from dtos.content_dto import AddContentRequest, ContentItemResponse
from enums.RoutesTagEnum import RoutesTagEnum
from services.content_service import ContentService

content_controller = APIRouter(prefix="/content", tags=[RoutesTagEnum.CONTENT.value])


@content_controller.post("/", response_model=ContentItemResponse, status_code=status.HTTP_201_CREATED)
def add_content(
    data: AddContentRequest,
    service: ContentService = Depends(ContentService),
):
    return service.add(data.url)


@content_controller.get("/", response_model=list[ContentItemResponse])
def list_content(
    service: ContentService = Depends(ContentService),
):
    return service.list_all()


@content_controller.delete("/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_content(
    item_id: int,
    service: ContentService = Depends(ContentService),
):
    service.remove(item_id)
