FROM node:lts-alpine

# Set the working directory to /app
WORKDIR /src

# Install only production dependencies
COPY ./src/package*.json /src/
RUN npm install --only=production

COPY ./src /src

# Set the working directory for running documentation generation
WORKDIR /src/src
RUN npm run doc

# Set the working directory back to the root of the project
WORKDIR /src

# The application code will be mounted as a volume when running the container

# Start the application
CMD ["npm", "start"]

# FROM node:lts-alpine

# WORKDIR /src

# COPY ./src/package*.json /src/
# RUN npm install --omit=dev

# COPY ./src /src

# WORKDIR /src/src
# RUN npm run doc

# WORKDIR /src

# CMD npm start


