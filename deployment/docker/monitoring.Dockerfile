FROM golang:1.26-alpine AS builder
WORKDIR /app
COPY backend/services/monitoring/ .
RUN go mod tidy
RUN CGO_ENABLED=0 go build -o /tagent-monitoring ./cmd/server

FROM alpine:3.23
RUN apk --no-cache add ca-certificates
COPY --from=builder /tagent-monitoring /usr/local/bin/
EXPOSE 8082
CMD ["tagent-monitoring"]
