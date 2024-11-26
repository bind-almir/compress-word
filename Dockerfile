FROM ubuntu:22.04
RUN apt-get update && apt-get install -y \
    build-essential \
    zlib1g-dev \
    gcc \
    clang \
    python3 \
    python3-pip \
    && apt-get clean

WORKDIR /app
COPY custom.c /app
RUN gcc -o custom custom.c -lz
COPY server.py /app
RUN pip3 install flask
EXPOSE 5000
CMD ["python3", "server.py"]
