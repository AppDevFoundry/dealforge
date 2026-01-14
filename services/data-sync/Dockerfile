# Build stage
FROM golang:1.22-alpine AS builder

WORKDIR /app

# Copy go mod files
COPY go.mod go.sum ./
RUN go mod download

# Copy source code
COPY . .

# Build the binary
RUN CGO_ENABLED=0 GOOS=linux go build -o sync ./cmd/sync

# Runtime stage
FROM alpine:3.19

WORKDIR /app

# Copy binary from builder
COPY --from=builder /app/sync .

# Run as non-root user
RUN adduser -D -g '' appuser
USER appuser

ENTRYPOINT ["./sync"]
