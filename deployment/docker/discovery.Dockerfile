FROM golang:1.26-alpine AS builder
WORKDIR /app
COPY backend/services/discovery/ ./services/discovery/
COPY backend/shared/ ./shared/
WORKDIR /app/services/discovery
RUN go mod tidy
RUN CGO_ENABLED=0 go build -o /tagent-discovery ./cmd/server

FROM alpine:3.23
RUN apk --no-cache add ca-certificates
COPY --from=builder /tagent-discovery /usr/local/bin/
EXPOSE 8081
CMD ["tagent-discovery"]
