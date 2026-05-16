FROM golang:1.21-alpine AS builder
WORKDIR /app
COPY backend/services/discovery/ .
RUN go mod tidy
RUN CGO_ENABLED=0 go build -o /tagent-discovery ./cmd/server

FROM alpine:3.19
RUN apk --no-cache add ca-certificates
COPY --from=builder /tagent-discovery /usr/local/bin/
EXPOSE 8081
CMD ["tagent-discovery"]
