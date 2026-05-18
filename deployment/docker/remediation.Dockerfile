FROM golang:1.21-alpine AS builder
WORKDIR /app
COPY backend/services/remediation/ .
RUN go mod tidy
RUN CGO_ENABLED=0 go build -o /tagent-remediation ./cmd/server

FROM alpine:3.23
RUN apk --no-cache add ca-certificates
COPY --from=builder /tagent-remediation /usr/local/bin/
EXPOSE 8084
CMD ["tagent-remediation"]
