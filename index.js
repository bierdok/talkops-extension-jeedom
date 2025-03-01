import { Extension, Readme, Service } from "talkops";

const extension = new Extension("Jeedom");

extension.setDockerRepository("bierdok/talkops-extension-jeedom");

extension.setDescription(`
This Extension based on [Jeedom](https://jeedom.com/) allows you to **control your smart home by voice in realtime**.

Features:
* Lights: Check status, turn on/off
* Shutters: Check status, open, close and stop
`);

extension.setInstallationGuide(`
* Open Jeedom from a web browser with admin permissions.
* Navigate to \`Settings → System → Configuration\`.
* Select the \`APIs\` tab and \`Enabled\` the API access related to API key.
* Copy the API key to setup the environment variable \`API_KEY\`.
* Install and enable the plugin [Virtual](https://market.jeedom.com/index.php?v=d&p=market_display&id=21) from the Jeedom Market.
* Create the virtual equipments with the basic templates \`Lumière\` and \`Volet\`.
* Map the virtual equipments states on real equipments.
`);

extension.setEnvironmentVariables({
  BASE_URL: {
    description: "The base URL of your Jeedom server.",
    possibleValues: ["http://jeedom", "https://jeedom.mydomain.net"],
  },
  API_KEY: {
    description: "The copied API key.",
  },
});

const baseInstructions = `
You are a home automation assistant, focused solely on managing connected devices in the home.
When asked to calculate an average, **round to the nearest whole number** without explaining the calculation.
`;

const defaultInstructions = `
Currently, there is no connected devices.
Your sole task is to ask the user to install one or more connected devices in the home before proceeding.
`;

import axios from "axios";
import yaml from "js-yaml";

import locationsModel from "./schemas/models/locations.json" assert { type: "json" };
import lightsModel from "./schemas/models/lights.json" assert { type: "json" };
import shuttersModel from "./schemas/models/shutters.json" assert { type: "json" };

import updateLightsFunction from "./schemas/functions/update_lights.json" assert { type: "json" };
import updateShuttersFunction from "./schemas/functions/update_shutters.json" assert { type: "json" };

async function request(method, params) {
  return await axios.post(`${process.env.BASE_URL}/core/api/jeeApi.php`, {
    jsonrpc: "2.0",
    method,
    params: { apikey: process.env.API_KEY, ...params },
    id: 1,
  });
}

const getPlugins = async () => {
  try {
    const response = await request("plugin::listPlugin");
    return response.data.result;
  } catch (err) {
    extension.errors.push(err.message);
  }
  return [];
};

const getVersion = async () => {
  try {
    const response = await request("version");
    return response.data.result;
  } catch (err) {
    extension.errors.push(err.message);
  }
  return null;
};

const getObjects = async () => {
  try {
    const response = await request("jeeObject::full");
    return response.data.result;
  } catch (err) {
    extension.errors.push(err.message);
  }
  return [];
};

const cmds = new Map();
async function refresh() {
  const locations = [];
  const lights = [];
  const shutters = [];
  extension.errors = [];
  const plugins = await getPlugins();
  const hasPlugin = plugins.some(
    (plugin) => plugin.id === "virtual" && plugin.source === "market"
  );
  extension.errors = hasPlugin
    ? []
    : [
        'The plugin "Virtual" from the Jeedom Market must be installed and enabled.',
      ];
  extension.setVersion(await getVersion());
  const objects = await getObjects();
  for (const object of objects) {
    locations.push({
      id: object.id,
      name: object.name,
      location_id: object.father_id,
    });
    if (!object.eqLogics.length) continue;
    for (const equipement of object.eqLogics) {
      if (equipement.eqType_name !== "virtual") continue;
      cmds.set(equipement.id, equipement.cmds);
      for (const cmd of equipement.cmds) {
        if (cmd.generic_type === "LIGHT_STATE") {
          lights.push({
            id: equipement.id,
            name: equipement.name,
            state: cmd.state ? "on" : "off",
            location_id: equipement.object_id,
          });
        }
        if (cmd.generic_type === "FLAP_STATE") {
          shutters.push({
            id: equipement.id,
            name: equipement.name,
            state: cmd.state || "unknown",
            location_id: equipement.object_id,
          });
        }
      }
    }
  }

  extension.setInstructions(() => {
    const instructions = [baseInstructions];

    if (!lights.length && !shutters.length) {
      instructions.push(defaultInstructions);
    } else {
      instructions.push("``` yaml");
      instructions.push(
        yaml.dump({
          locationsModel,
          lightsModel,
          shuttersModel,
          locations,
          lights,
          shutters,
        })
      );
      instructions.push("```");
    }

    return instructions;
  });

  extension.setFunctionSchemas(() => {
    const functionSchemas = [];
    if (lights.length) {
      functionSchemas.push(updateLightsFunction);
    }
    if (shutters.length) {
      functionSchemas.push(updateShuttersFunction);
    }
    return functionSchemas;
  });

  setTimeout(refresh, 5000);
}
refresh();

extension.setFunctions([
  async function update_lights(action, ids) {
    try {
      for (const id of ids) {
        for (const cmd of cmds.get(parseInt(id))) {
          if (cmd.generic_type !== `LIGHT_${action.toUpperCase()}`) continue;
          request("cmd::execCmd", { id: cmd.id });
        }
      }
      return "Done.";
    } catch (err) {
      return `Error: ${err.message}`;
    }
  },
  async function update_shutters(action, ids) {
    try {
      for (const id of ids) {
        for (const cmd of cmds.get(parseInt(id))) {
          if (cmd.generic_type !== `FLAP_${action.toUpperCase()}`) continue;
          request("cmd::execCmd", { id: cmd.id });
        }
      }
      return "Done.";
    } catch (err) {
      return `Error: ${err.message}`;
    }
  },
]);

new Readme(process.env.README_TEMPLATE_URL, "/app/README.md", extension);
new Service(process.env.AGENT_URLS.split(","), extension);
