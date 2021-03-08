import fs from 'fs';

export const readJsonSourceFiles = jsonSourceFiles => {
  const data = new Map();
  for (const jsonFile of jsonSourceFiles) {
    const newData = JSON.parse(fs.readFileSync(jsonFile));
    newData.forEach(element => {
      const old = data.get(element['Case Number']);
      if (!old || old['Time Stamp'] < element['Time Stamp'])
        data.set(element['Case Number'], element);
    });
  }
  return ([...data.values()]);
};
