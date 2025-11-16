FROM heroiclabs/nakama:3.17.1

# Create the data directory
RUN mkdir -p /nakama/data /nakama/data/modules

# Copy the configuration file
COPY ./server/nakama/config.yaml /nakama/data/config.yaml

# Copy Lua/JS modules into the Nakama runtime modules folder
# Adjust the source path if your modules are elsewhere
COPY ./server/nakama/modules /nakama/data/modules

# Set the working directory
WORKDIR /nakama

# Expose ports
EXPOSE 7349 7350 7351 9100

# Run Nakama (exec form)
CMD ["/nakama/nakama", "--config", "/nakama/data/config.yaml"]
