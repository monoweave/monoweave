FROM node:22-slim

ENV LC_ALL=C.UTF-8
ENV LANG=C.UTF-8
ENV LOCAL_REGISTRY="http://0.0.0.0:4873"
ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0
ENV YARN_NODE_LINKER="node-modules"

RUN apt-get update && \
    apt-get install -yq git dumb-init && \
    corepack enable

WORKDIR /home/node
RUN chown -R node: /home/node

USER node

RUN yarn dlx -p verdaccio@5.32.1 binarydoesntexist || true
RUN yarn dlx -p npm-cli-login binarydoesntexist || true

COPY ./docker/ /home/node/

ENTRYPOINT ["/usr/bin/dumb-init", "--"]
CMD [ "/home/node/init.sh" ]
