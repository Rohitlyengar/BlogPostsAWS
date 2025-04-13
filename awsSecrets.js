import {
    SecretsManagerClient,
    GetSecretValueCommand,
} from "@aws-sdk/client-secrets-manager";

const secret_name = "secret/phone";

const client = new SecretsManagerClient({
    region: "us-west-2",
});

let response;

try {
    response = await client.send(
        new GetSecretValueCommand({
            SecretId: secret_name,
            VersionStage: "AWSCURRENT",
        })
    );
} catch (error) {
    console.log(error)
}

module.exports = response.SecretString;

