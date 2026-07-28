"""Shared model primitives.

`PyObjectId` used to be copy-pasted into userModel.py and artistModel.py, both
written in Pydantic-v1 style (`__get_validators__`) on a Pydantic 2.11 install -
so neither copy's validator was ever called.
"""

from typing import Any

from bson import ObjectId
from pydantic import GetCoreSchemaHandler
from pydantic_core import core_schema


class PyObjectId(ObjectId):
    """A bson ObjectId that Pydantic v2 can validate and serialize as a str."""

    @classmethod
    def __get_pydantic_core_schema__(
        cls, source_type: Any, handler: GetCoreSchemaHandler
    ) -> core_schema.CoreSchema:
        def validate(value: Any) -> ObjectId:
            if isinstance(value, ObjectId):
                return value
            if isinstance(value, str) and ObjectId.is_valid(value):
                return ObjectId(value)
            raise ValueError("Invalid ObjectId")

        return core_schema.json_or_python_schema(
            json_schema=core_schema.str_schema(),
            python_schema=core_schema.no_info_plain_validator_function(validate),
            serialization=core_schema.plain_serializer_function_ser_schema(str),
        )
