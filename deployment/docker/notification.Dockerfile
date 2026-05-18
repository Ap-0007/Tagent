FROM golang:1.26-alpine AS builder
WORKDIR /app
COPY backend/services/notification/ .
RUN go mod tidy
RUN CGO_ENABLED=0 go build -o /tagent-notification ./cmd/server

FROM alpine:3.23
RUN apk --no-cache add ca-certificates
COPY --from=builder /tagent-notification /usr/local/bin/
EXPOSE 8085
CMD ["tagent-notification"]
