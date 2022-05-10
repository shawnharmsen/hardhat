import { task } from "hardhat/config";
import { NomicLabsHardhatPluginError } from "hardhat/internal/core/errors";
import camelcaseKeys = require("camelcase-keys");
import { registerCompilerArgs, registerProjectPathArgs } from "../common";
import { spawnBuild, ForgeTestArgs } from "./test";

registerProjectPathArgs(registerCompilerArgs(task("test")))
  .setDescription("Compiles the entire project with forge")
  .addFlag(
    "offline",
    "Do not access the network. Missing solc versions will not be installed."
  )
  .addFlag(
    "viaIr",
    "Use the Yul intermediate representation compilation pipeline."
  )
  .setAction(async (args, {}) => {
    const buildArgs = await getCheckedArgs(args);
    await spawnBuild(buildArgs);
  });

async function getCheckedArgs(args: any): Promise<ForgeTestArgs> {
  // Get and initialize option validator
  const { default: buildArgsSchema } = await import("../build/build-ti");
  const { default: envArgsSchema } = await import("../common/env-ti");
  const { default: evmArgsSchema } = await import("../common/evm-ti");
  const { default: compilerArgsSchema } = await import("../common/compiler-ti");
  const { default: projectPathsSchema } = await import(
    "../common/projectpaths-ti"
  );
  const { createCheckers } = await import("ts-interface-checker");
  const { ForgeBuildArgsTi } = createCheckers(
    buildArgsSchema,
    envArgsSchema,
    evmArgsSchema,
    compilerArgsSchema,
    projectPathsSchema
  );
  const uncheckedBuildArgs = camelcaseKeys(args);
  // Validate all options agains validator
  try {
    ForgeBuildArgsTi.check(uncheckedBuildArgs);
  } catch (e: any) {
    throw new NomicLabsHardhatPluginError(
      "@nomiclabs/hardhat-forge",
      `Forge build config is invalid: ${e.message}`,
      e
    );
  }
  return uncheckedBuildArgs as ForgeTestArgs;
}
