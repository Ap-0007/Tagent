FROM golang:1.21-alpine AS builder
WORKDIR /app
COPY backend/services/monitoring/ .
RUN go mod download
RUN CGO_ENABLED=0 go build -o /tagent-monitoring ./cmd/server

FROM alpine:3.19
RUN apk --no-cache add ca-certificates
COPY --from=builder /tagent-monitoring /usr/local/bin/
EXPOSE 8082
CMD ["tagent-monitoring"]
