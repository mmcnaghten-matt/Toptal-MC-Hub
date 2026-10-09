FROM denoland/deno:alpine
WORKDIR /app
COPY main.ts .
RUN deno cache main.ts
# Cloud Run sets PORT (8080). GEMINI_API_KEY comes from Secret Manager.
EXPOSE 8080
CMD ["run", "--allow-net", "--allow-env", "main.ts"]
