@Library('ocio-wcms-shared-pipeline-library')_

sharedPipeline(
    project:'eta-arpa',
    deployment:'arpa-ui',
    dev:'dev02',
    test:'test02',
    prod:'prod02',
    kanikoBuildParams: "--build-arg ENV_NAME=wcms --build-arg BASE_PYTHON_IMAGE_REGISTRY=ddphub.azurecr.io/dol-official --build-arg BASE_PYTHON_IMAGE_VERSION=3.9.7.0 --single-snapshot --target djangobase-wcms --skip-unused-stages true",

    APPLICATION_VERSION: "true",
    APPLICATION_TIMESTAMP: "true"
)
