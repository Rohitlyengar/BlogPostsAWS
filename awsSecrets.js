
const { SecretsManagerClient, GetSecretValueCommand } = require("@aws-sdk/client-secrets-manager");

const getSecret = async (secretName) => {
    const client = new SecretsManagerClient({ region: "us-west-2" });

    try {
        const command = new GetSecretValueCommand({ SecretId: secretName });
        const response = await client.send(command);

        if (response.SecretString) {
            return JSON.parse(response.SecretString);
        } else if (response.SecretBinary) {
            const buff = Buffer.from(response.SecretBinary, "base64");
            return JSON.parse(buff.toString("ascii"));
        } else {
            throw new Error("SecretString and SecretBinary are both undefined.");
        }
    } catch (error) {
        console.error("Error retrieving secret:", error);
    }
};

module.exports = getSecret;
