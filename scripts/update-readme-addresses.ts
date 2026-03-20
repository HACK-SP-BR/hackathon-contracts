import fs from "fs";
import path from "path";

type Deployments = Record<string, Record<string, string>>;

const README_PATH = path.resolve(process.cwd(), "README.md");
const DEPLOYMENTS_PATH = path.resolve(process.cwd(), "deployments.json");

const START_MARKER = "<!-- CONTRACT_ADDRESSES_START -->";
const END_MARKER = "<!-- CONTRACT_ADDRESSES_END -->";

const EXPLORERS: Record<string, { network: string; baseUrl?: string }> = {
    local: { network: "Local Hardhat" },
    dev: {
        network: "Base Sepolia",
        baseUrl: "https://sepolia.basescan.org/address/",
    },
    prod: {
        network: "Base Mainnet",
        baseUrl: "https://basescan.org/address/",
    },
};

function buildSection(deployments: Deployments) {
    const lines = [
        START_MARKER,
        "This section is generated from [`deployments.json`](/home/dweg0/Documents/hacksp/admin-painel/contracts/deployments.json).",
        "",
        "| Environment | Network | Contract | Address | Explorer |",
        "| --- | --- | --- | --- | --- |",
    ];

    for (const [environment, contracts] of Object.entries(deployments)) {
        const explorer = EXPLORERS[environment] ?? { network: "Custom" };

        for (const [contractName, address] of Object.entries(contracts)) {
            const explorerLink = explorer.baseUrl
                ? `[View on BaseScan](${explorer.baseUrl}${address})`
                : "Not public";

            lines.push(
                `| \`${environment}\` | ${explorer.network} | \`${contractName}\` | \`${address}\` | ${explorerLink} |`
            );
        }
    }

    lines.push(
        "",
        "Run `npm run readme:addresses` after each deployment to refresh this table.",
        END_MARKER
    );

    return lines.join("\n");
}

function main() {
    if (!fs.existsSync(README_PATH)) {
        throw new Error("README.md not found");
    }

    if (!fs.existsSync(DEPLOYMENTS_PATH)) {
        throw new Error("deployments.json not found");
    }

    const readme = fs.readFileSync(README_PATH, "utf-8");
    const deployments = JSON.parse(
        fs.readFileSync(DEPLOYMENTS_PATH, "utf-8")
    ) as Deployments;

    if (!readme.includes(START_MARKER) || !readme.includes(END_MARKER)) {
        throw new Error("README markers for contract addresses were not found");
    }

    const nextSection = buildSection(deployments);
    const updatedReadme = readme.replace(
        new RegExp(`${START_MARKER}[\\s\\S]*?${END_MARKER}`),
        nextSection
    );

    fs.writeFileSync(README_PATH, updatedReadme);
    console.log("README contract addresses updated from deployments.json");
}

main();
