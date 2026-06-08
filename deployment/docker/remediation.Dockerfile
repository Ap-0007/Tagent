FROM golang:1.26-alpine AS builder
WORKDIR /app
COPY backend/services/remediation/ ./services/remediation/
COPY backend/shared/ ./shared/
WORKDIR /app/services/remediation
RUN sed -i 's|../../../shared/pkg/events|../../shared/pkg/events|g' go.mod
RUN go mod tidy
RUN CGO_ENABLED=0 go build -o /tagent-remediation ./cmd/server

FROM alpine:3.23
RUN apk --no-cache add ca-certificates
COPY --from=builder /tagent-remediation /usr/local/bin/
EXPOSE 8084
CMD ["tagent-remediation"]
