FROM golang:1.21-alpine AS builder
WORKDIR /app
COPY backend/services/api-gateway/ .
RUN go mod tidy
RUN CGO_ENABLED=0 go build -o /tagent-api-gateway ./cmd/server

FROM alpine:3.23
RUN apk --no-cache add ca-certificates
COPY --from=builder /tagent-api-gateway /usr/local/bin/
EXPOSE 8080
CMD ["tagent-api-gateway"]
