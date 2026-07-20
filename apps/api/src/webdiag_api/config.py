from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_prefix="WEBDIAG_", case_sensitive=False)
    environment: str = "development"
    public_release: bool = False

settings = Settings()
