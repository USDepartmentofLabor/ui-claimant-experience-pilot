@Library('ocio-wcms-shared-pipeline-library')_

sharedPipeline(
    project:'eta-arpa',
    deployment:'arpa-ui',
    dev:'dev02',
    test:'test02',
    prod:'prod02',
    kanikoBuildParams: "--build-arg ENV_NAME=wcms --single-snapshot",
    APPLICATION_VERSION: "true",
    APPLICATION_TIMESTAMP: "true"
)
