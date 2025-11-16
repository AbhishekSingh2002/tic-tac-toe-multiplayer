FROM heroiclabs/nakama:3.17.1

# Create modules directory if it doesn't exist
RUN mkdir -p /nakama/data/modules

# Copy custom runtime modules
COPY nakama/modules /nakama/data/modules

# Copy nakama configuration
COPY nakama/nakama.yml /nakama/data/nakama.yml

# Expose ports
# 7349 - gRPC API
# 7350 - HTTP/1.1 API
# 7351 - Console
EXPOSE 7349 7350 7351

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:7350/ || exit 1

# Run nakama with the configuration file
ENTRYPOINT ["/nakama/nakama"]
CMD ["--config", "/nakama/data/nakama.yml"]
