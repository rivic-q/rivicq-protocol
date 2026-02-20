# Stage 1: Builder
FROM rust:1.77-bookworm AS builder

# Install required dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    pkg-config \
    libssl-dev \
    libudev-dev \
    protobuf-compiler \
    clang \
    && rm -rf /var/lib/apt/lists/*

# Set environment variables
ENV CARGO_HOME=/cargo
ENV RUSTUP_HOME=/rustup
ENV PATH=/cargo/bin:$PATH

# Create cargo directory
RUN mkdir -p $CARGO_HOME

WORKDIR /build

# Copy Cargo files
COPY Cargo.toml Cargo.lock ./
COPY src ./src

# Build the program
RUN cargo build --release --locked 2>&1 || cargo build --release

# Stage 2: Runtime
FROM debian:bookworm-slim AS runtime

# Install runtime dependencies
RUN apt-get update && apt-get install -y \
    ca-certificates \
    libssl3 \
    tzdata \
    && rm -rf /var/lib/apt/lists/*

# Create non-root user
RUN useradd -m -u 1000 -s /bin/bash appuser

WORKDIR /home/appuser

# Copy the compiled program
COPY --from=builder /build/target/release/crosschain_hub.so /home/appuser/
COPY --from=builder /build/target/release/crosschain_hub /home/appuser/

# Copy necessary files
COPY --chown=appuser:appuser . /home/appuser/

# Set permissions
RUN chmod 755 /home/appuser/crosschain_hub.so \
    && chmod 755 /home/appuser/crosschain_hub

USER appuser

# Default command - shows help
CMD ["--help"]
