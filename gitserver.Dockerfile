FROM alpine:3.19

RUN apk add --no-cache openssh git bash \
    && ssh-keygen -A \
    && addgroup git \
    && adduser -D -G git -s /bin/bash git \
    && mkdir -p /git-server/repos /git-server/keys /home/git/.ssh \
    && chown -R git:git /home/git/.ssh /git-server \
    && chmod 700 /home/git/.ssh

COPY sshd_config /etc/ssh/sshd_config
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

EXPOSE 22
ENTRYPOINT ["/entrypoint.sh"]
