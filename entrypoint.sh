#!/bin/sh
set -e

mkdir -p /home/git/.ssh /git-server/repos

if [ -f /git-server/keys/authorized_keys ]; then
    cp /git-server/keys/authorized_keys /home/git/.ssh/authorized_keys
    chown git:git /home/git/.ssh/authorized_keys
    chmod 600 /home/git/.ssh/authorized_keys
fi

chown -R git:git /git-server/repos
chmod 700 /home/git/.ssh

exec /usr/sbin/sshd -D -e
