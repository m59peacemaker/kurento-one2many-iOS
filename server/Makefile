project = o2m

node_image = ${project}_node
kms_image  = ${project}_kms
data_image = ubuntu:14.04

node_container = ${project}_node
kms_container  = ${project}_kms
containers     = ${node_container} ${kms_container}

data_container = ${project}_data

#-----

.PHONY: build-kms
build-kms:
	@docker build -t ${kms_image} ./kms

.PHONY: build-node
build-node:
	@docker build -t ${node_image} ./node

.PHONY: build
build: build-kms build-node

#-----

run_data = docker run -d      \
  --name ${data_container}    \
  -v /app_state/node          \
  ${data_image}

up-data:
	@${run_data}

run_kms = docker run -d            \
  --name ${kms_container}          \
  --net=host                       \
  --volumes-from ${data_container} \
  ${kms_image}

.PHONY: up-kms
up-kms:
	@${run_kms}

run_node = docker run ${1}        \
  --name ${node_container}        \
  --net=host                      \
  --volume-from ${data_container} \
  -v $(shell pwd)/node:/app/node  \
  ${node_image}

.PHONY: up-node
up-node:
	@$(call run_node,-it)

#-----

.PHONY: shell-kms
shell-kms:
	@docker exec -it ${kms_container} /bin/bash

.PHONY: shell-node
shell-node:
	@docker exec -it ${node_container} /bin/bash

#-----

.PHONY: clean-state
clean-state:
	@docker rm ${data_container}

.PHONY: clean-containers
clean-containers:
	@docker rm -f ${containers}

.PHONY: clean
clean: clean-containers
