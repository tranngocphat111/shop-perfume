# Stage 1: Build the Maven application
FROM maven:3.8.5-openjdk-17 AS build
WORKDIR /app
COPY pom.xml .
# Download dependencies first (cached layer)
RUN mvn dependency:go-offline -B
COPY src ./src
RUN mvn package -DskipTests

# Stage 2: Run the application
FROM eclipse-temurin:17-jre-jammy
# Create a non-root user (UID 1000) as required by Hugging Face
RUN useradd -m -u 1000 user
USER user
WORKDIR /app

# Copy the built jar from Stage 1
COPY --from=build --chown=user:user /app/target/server-*.jar app.jar

# Hugging Face Spaces listen on port 7860
EXPOSE 7860
ENV PORT=7860
# Set Spring Boot port environment variable
ENV SERVER_PORT=7860

CMD ["java", "-jar", "app.jar"]
