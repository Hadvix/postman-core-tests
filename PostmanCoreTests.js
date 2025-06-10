/**
 * Funkce pro management a výpis chybových hlášek v catch bloku
 * @param {object} error - chybový objekt zachytávaný v catch bloku
 * @param {string} [functionName='anonymous'] - název funkce, ve které dochází k chybě
 */
function handleError(error, functionName = 'anonymous') {
  // kontrola error objektu
  try {
    if (typeof error !== 'object' || error === null) {
      console.error(`[${functionName}] Invalid error object:`, error);
      return;
    }
    // fallback pro špatně zadaný název funkce v parametru
    if (typeof functionName !== 'string' || functionName.trim() === '') {
      functionName = 'anonymous';
    }
    // hlavní činnost handleru
    const message = error.message || JSON.stringify(error);
    console.error(`[${functionName}] Error: ${message}`);
    // vypsání stacku, pokud existuje
    if (error.stack) {
      console.error(`Stack trace \n${error.stack}`);
    }
    // 
    if (typeof pm !== 'undefined' && pm.response && typeof pm.response.text === 'function') {
      console.error(`Response body: ${pm.response.text()}`);
      }

  } catch (internalError) {
    console.error('Fatal error in handleError itself:', internalError.message);
  }
}

/**
 * Kontroluje status kód odpovědi.
 * Výchozí hodnota status kódu je 200.
 *
 * @param {number} [expectedStatus=200] - Očekávaný status kód odpovědi.
 * @example
 * // Testuje, že odpověď má status 200:
 * checkResponseStatus();
 *
 * // Testuje, že odpověď má status 404:
 * checkResponseStatus(404);
 */
function checkResponseStatus(expectedStatus = 200) {
  pm.test(`Status code is ${expectedStatus}`, () => {
    pm.response.to.have.status(expectedStatus);
  });
}

/**
 * Kontroluje, že odpověď je ve formátu JSON.
 * Testuje správnost hlavičky Content-Type i validitu naparsovaného JSON objektu.
 */
function checkResponseJson() {
  pm.test('Response should be valid JSON', () => {
    try {
      // Kontrola hlavičky Content-Type
      const contentType = pm.response.headers.get('Content-Type');
      pm.expect(contentType, 'Content-Type header exists').to.exist;
      pm.expect(contentType, 'Content-Type includes application/json').to.include(
      'application/json'
      );
      // Pokusí se naparsovat JSON a provést test
      const jsonData = pm.response.json();
      // pokud výsledný objekt nemá žádný klíč, tak vyhodí chybu
      if (Object.keys(jsonData).length === 0) {
        throw new Error('No valid key in JSON object');
      }
      // Ověří, že tělo je objekt 
      pm.expect(jsonData, 'Response body is valid JSON').to.satisfy(
      (data) => typeof data === 'object' && data !== null
      );
    } catch (error) {
      console.error('checkResponseJson() - Raw response:', pm.response.text());
      pm.expect.fail(`Unable to parse JSON: ${error.message}`);
    }
  });
}

/**
 * Kontrola, že tělo odpovědi je prázdné.
 */
function checkEmptyResponse() {
  pm.test('Response body is empty', () => {
    try {
      pm.expect(pm.response.text()).to.be.empty;
    } catch (error) {
      console.error('checkEmptyResponse() - Raw response:', pm.response.text());
      pm.expect.fail(`Unable to process response body: ${error.message}`);
    }
  });
}

/**
 * Kontrola, že tělo odpovědi není prázdné.
 */
function checkNotEmptyResponse() {
  pm.test('Response body is not empty', () => {
    try {
      pm.expect(pm.response.text()).to.not.be.empty;
    } catch (error) {
      console.error('checkNotEmptyResponse() - Raw response:', pm.response.text());
      pm.expect.fail(`Unable to process response body: ${error.message}`);
    }
  });
}

/**
 * Kontrola rychlosti odezvy API
 * @param {number} [delay=200] - Limit pro dobu odezvy zadaný v milisekundách. Výchozí hodnota 200 ms.
 *
 * @example
 * // Testuje dobu odpovědi proti limitu s výchozí hodnotou:
 * checkResponseTime();
 *
 * // Testuje dobu odpovědi s 500ms:
 * checkResponseTime(500);
 */
function checkResponseTime(delay = 200) {
  try {
    // kontrola inputu na platné číslo
    if (typeof delay !== 'number' || isNaN(delay) || delay <= 0) {
      throw new Error('Inputed response delay is not a valid number greater than 0!');
    }

    // kontrola pm runtime a existence odpovědi
    if (typeof pm === 'undefined' || !pm.response) {
      throw new Error('Postman runtime (pm) or response is not available!');
    }

    const actualResponseTime = pm.response.responseTime ?? null;

    // kontrola, že získaný response time je null nebo není platné číslo
    if (actualResponseTime === null || typeof actualResponseTime !== 'number') {
      throw new Error('Response time is not valid number!');
    }

    // hlavní test
    pm.test(
      `Response time is acceptable: Response time (${actualResponseTime}ms) < Limit (${delay}ms)`,
      () => {
        pm.expect(
          actualResponseTime,
          `${actualResponseTime}ms > ${delay}ms`
        ).to.be.below(delay);
      }
    );
  } catch (error) {
    console.error('checkResponseTime() - ', error.message);
    pm.test('Unable to process checkResponseTime()', () => {
      pm.expect.fail(`${error.message}`);
    });
  }
}

/**
 * Kontroluje JSON odpovědi na výskyt specifické vlastnosti na první úrovni.
 *
 * @param {string} propertyName - Název vlastnosti, která má být nalezena v JSON odpovědi.
 *
 * @example
 * // Testuje JSON odpovědi na výskyt vlastnosti 'branches'
 * checkResponseProperty('branches');
 *
 * // Testuje JSON odpovědi po POST požadavku na přítomnost id:
 * checkResponseProperty('id');
 */
function checkResponseProperty(propertyName) {
  pm.test(`Has property: ${propertyName}`, () => {
    try {
     const jsonData = pm.response.json();
      pm.expect(jsonData).to.have.property(propertyName);
    } catch (error) {
      console.error('Raw response:', pm.response.text());
      pm.expect.fail(`Unable to parse JSON: ${error.message}`);
    }
  });
}

/**
 * Vytváří vizualizaci odpovědi JSON na 2D tabulku v záložce Visualization
 */
function visualizeJson() {
  let response;
  try {
    response = pm.response.json();
  } catch (error) {
    response = { 'error.name': error.name, 'error.message': error.message };
  }

  // Funkce pro rozbalení JSON objektů do plochého formátu
  function flattenObject(obj, prefix = '') {
    let result = {};
    for (let key in obj) {
      let propName = prefix ? `${prefix}.${key}` : key;
      if (
        typeof obj[key] === 'object' &&
        obj[key] !== null &&
        !Array.isArray(obj[key])
      ) {
        Object.assign(result, flattenObject(obj[key], propName));
      } else if (Array.isArray(obj[key])) {
        obj[key].forEach((item, index) => {
          if (typeof item === 'object' && item !== null) {
            Object.assign(result, flattenObject(item, `${propName}[${index}]`));
          } else {
            result[`${propName}[${index}]`] = item;
          }
        });
      } else {
        result[propName] = obj[key];
      }
    }
    return result;
  }

  // Najdeme hlavní pole v JSON
  let mainArray = Array.isArray(response)
    ? response
    : Object.entries(response).find(([key, value]) =>
        Array.isArray(value)
      )?.[1];

  // Ostatní hodnoty mimo hlavní pole (např. timestampy)
  let globalValues = {};
  if (typeof response === 'object' && !Array.isArray(response)) {
    globalValues = Object.fromEntries(
      Object.entries(response).filter(
        ([key, value]) => !Array.isArray(value) && typeof value !== 'object'
      )
    );
  }

  // Pokud neexistuje hlavní pole, vytvoříme jednořádkovou tabulku z celého JSONu
  let dataArray = mainArray || [response];

  // Převedeme každý objekt v poli na 'plochou' strukturu + přidáme globální hodnoty
  let flatData = dataArray.map((item) => ({
    ...globalValues, // Přidání globálních hodnot (např. timestamp)
    ...flattenObject(item),
  }));

  // Dynamicky zjistíme všechny unikátní klíče (sloupce tabulky)
  let keys = [...new Set(flatData.flatMap((obj) => Object.keys(obj)))];

  // **Handlebars šablona pro vizualizaci**
  let template = `
  <style>
      table {
          border-collapse: collapse;
          width: 100%;
          font-family: Arial, sans-serif;
      }
      th, td {
          border: 1px solid #ddd;
          padding: 8px;
          text-align: left;
      }
      th {
          background-color: #f2f2f2;
          font-weight: bold;
      }
      td {
        background-color: white;
      }
  </style>

  <table>
    <thead>
       <tr>
            {{#each headers}}<th>{{this}}</th>{{/each}}
        </tr>
    </thead>
    <tbody>
        {{#each rows}}
        <tr>
            {{#each this}}
            <td>{{this}}</td>
            {{/each}}
        </tr>
       {{/each}}
   </tbody>
  </table>
  `;

  // Předáme data do Postman Visualizeru
  pm.visualizer.set(template, {
    headers: keys,
    rows: flatData.map((row) => keys.map((key) => row[key] || '')), // Zachová pořadí hodnot podle klíčů
  });
}

/**
 * Testuje přítomnost Location Headeru pro POST požadavek
 */
function checkLocationHeader() {
  pm.test('Location header present', () => {
    pm.expect(pm.response.headers.has('Location')).to.be.true;
  });
}

/**
 * Testuje přítomnost dané vlastnosti v hlavičce odpovědi a její hodnotu
 * @param {string} headerName - očekávaný název hlavičky
 * @param {string} [value] - očekávaná hodnota hlavičky (volitelné)
 * @example
 * // Testuje přítomnost Content-Type a hodnotu application/json v odpovědi:
 * checkHeader('Content-Type', 'application/json');
 *
 * // Testuje pouze přítomnost hlavičky Content-Length:
 * checkHeader('Content-Length');
 */
function checkResponseHeader(headerName, value = null) {
  pm.test(`Response has header ${headerName}`, () => {
    // porovnání názvů hlaviček není case sensitive
    const headers = pm.response.headers.all();
    const foundHeader = headers.find(
      (h) => h.key.toLowerCase() === headerName.toLowerCase()
    );

    pm.expect(foundHeader, `${headerName} header exists`).to.exist;

    if (value !== null) {
      pm.expect(foundHeader.value, `${headerName} should be ${value}`).to.equal(value);
    }
  });
}

/**
 * Porovnává request body s response body, pokud status kód odpovídá úspěšnému požadavku
 * Použití u POST požadavku
 */
function compareRequestResponse() {
  pm.test('Response matches request data', () => {
    // Kontrola, zda request skončil úspěšně (2xx nebo 201 Created)
    pm.expect(pm.response.code).to.be.oneOf([200, 201]);

    // Bezpečné načtení request a response body
    let requestBody = {};
    let responseBody = {};

    try {
      requestBody = JSON.parse(pm.request.body.raw || '{}');
      responseBody = pm.response.json();
    } catch (error) {
      pm.expect.fail('Response body is not valid JSON');
      console.error(`Error.message: ${error.message}`);
    }

    // Ověření, že response body obsahuje všechna pole z request body
    pm.expect(responseBody).to.be.an(
      'object',
      'Response body should be a valid JSON object'
    );

    // Porovnání objektů
    pm.expect(responseBody).to.deep.include(
      requestBody,
      'Response body should include all request fields'
    );
  });
}

/**
 * Kontroluje výskyt "tvrdého" entru v těle dotazu i odpovědi
 */
function checkHardEnter() {
  pm.test('No hard enter in JSON body', () => {
    try {
      // načte hodnoty těla dotazu a odpovědi
      const responseBody = pm.response.text();
      // Regex tvrdého enteru v hodnotách JSON
      let regex = /:\s*"(?:[^"\\]|\\.)*[\r\n]+(?:[^"\\]|\\.)*"/g;
    
      pm.expect(responseBody).to.not.match(
        regex,
        'Found hard enter in Response JSON values!'
      );
    } catch (error) {
      console.error('checkHardEnter() - Raw response:', pm.response.text());
      pm.expect.fail(`Unable to process response body: ${error.message}`);
    }
  });
}

/**
 * Kontroluje výskyt tabulátoru, tvrdého enteru, řídících znaků a větší množství mezer v těle dotazu i odpovědi
 */
function checkInvalidCharacters() {
  pm.test('No invalid characters in JSON values', () => {
    let responseBody;
    let requestBody;

    try {
      responseBody = pm.response.json(); // Pokusíme se naparsovat JSON odpověď
    } catch (error) {
      pm.expect.fail('Response body is not valid JSON: ' + error.message);
      return;
    }

    try {
      requestBody = pm.request.body.raw ? JSON.parse(pm.request.body.raw) : null;
    } catch (error) {
      pm.expect.fail('Request body is not valid JSON: ' + error.message);
      return;
    }

    // Regex pro neplatné znaky
    const hardEnterRegex = /:\s*"(?:[^"\\]|\\.)*[\r\n]+(?:[^"\\]|\\.)*"/g; // hard enter
    const controlCharRegex = /[\t\x00-\x08\x0B\x0C\x0E-\x1F]/; // řídící znaky
    const tabCharRegex = /\t/; // tabulátor
    const excessiveSpaceRegex = / {4,}/; // excesivní 4 mezery

    function validateValues(obj) {
      if (typeof obj === 'string') {
        pm.expect(obj).to.not.match(hardEnterRegex, 'Found hard enter!');
        pm.expect(obj).to.not.match(controlCharRegex, 'Found control characters!');
        pm.expect(obj).to.not.match(excessiveSpaceRegex, 'Found excessive spaces!');
        pm.expect(obj).to.not.match(tabCharRegex, 'Found tab character!');
      } else if (typeof obj === 'object' && obj !== null) {
        for (let key in obj) {
          validateValues(obj[key]); // Rekurzivní kontrola vnořených objektů a polí
        }
      } else if (Array.isArray(obj)) {
        obj.forEach(validateValues); // Kontrola pro pole
      }
    }

    if (requestBody) validateValues(requestBody);
    validateValues(responseBody);
  });
}

/**
 * Testuje tělo odpovědi rozbalené na text na výskyt pouze předem stanovených znaků.
 * 
 * @param {RegExp} regex - Regulární výraz v regex formátu např. /^[a-z0-9]+$/
 * 
 * @example
 * // Testuje tělo odpovědi jako řetězec na výskyt pouze znaků a-z A-Z 0-9 , : " a mezery 
 * const allowedCharacters = /^[a-zA-Z0-9,:"\s]+$/
 * checkRegexMatch(allowedCharacters);
 */
function checkRegexMatch(regex) {
  pm.test('Response has only matching characters', () => {
    const responseText = pm.response.text();
    pm.expect(responseText).to.match(regex, 'Response contain not-allowed character');
  });
}

/**
 * Ověří, zda JSON odpověď odpovídá zadanému JSON schématu.
 *
 * Pokud odpověď neodpovídá zadanému schématu, test selže a zobrazí popisnou chybu.
 *
 * @param {Object} schema - JSON schéma, podle kterého se ověřuje struktura odpovědi.
 *
 * @example
 * const schema = {
 *   "type": "object",
 *   "properties": {
 *     "id": { "type": "integer" },
 *     "name": { "type": "string" }
 *   },
 *   "required": ["id", "name"]
 * };
 *
 * checkResponseBodyJsonSchema(schema);
 */
function checkResponseBodyJsonSchema(schema) {
  pm.test('Response matches JSON schema', () => {
    try {
      pm.response.to.have.jsonSchema(schema);
    } catch (error) {
      pm.expect.fail(`Error validating JSON Schema: ${error.message}`);
    }  
  })
}


/**
 * Ověří, zda JSON požadavku odpovídá zadanému JSON schématu.
 *
 * Pokud požadavek neodpovídá zadanému schématu, test selže a zobrazí popisnou chybu.
 *
 * @param {Object} schema - JSON schéma, podle kterého se ověřuje struktura odpovědi.
 *
 * @example
 * const schema = {
 *   "type": "object",
 *   "properties": {
 *     "id": { "type": "integer" },
 *     "name": { "type": "string" }
 *   },
 *   "required": ["id", "name"]
 * };
 *
 * checkRequestBodyJsonSchema(schema);
 */
function checkRequestBodyJsonSchema(schema) {
  pm.test('Request matches JSON schema', () => {
    try {
      if (!schema || typeof schema !== 'object') {
        pm.expect.fail('Invalid or missing JSON schema.');
      }
      const requestBody = JSON.parse(pm.request.body.raw);
      pm.expect(requestBody).to.have.jsonSchema(schema);
    } catch (error) {
      pm.expect.fail(`Error validating JSON Schema: ${error.message}`);
    }
  });
}


/**
 * Kontroluje JSON odpovědi na obsah unikátních hodnot v cestě level.key
 * Výchozí nastavení pro level.key je branches.id
 *
 * @param {string} [level='branches'] - odkaz na název pole v prvním levelu JSON, výchozí 'branches'
 * @param {string} [key='id'] - klíč, jehož hodnoty budou podrobeny kontrole unikátnosti, výchozí 'id'
 *
 * @example
 *  // testuje unikátnost hodnot v JSON na výchozí branches.id:
 * checkUniques();
 *
 *  // testuje unikátnost hodnot v JSON catalogItems.itemNumber:
 * checkUniques('catalogItems','itemNumber');
 */
function checkUniques(level = 'branches', key = 'id') {
  try {
    const jsonData = pm.response.json();

    if (!jsonData[level]) {
      throw new Error(`Level '${level}' does not exist in the response JSON.`);
    }

    if (!Array.isArray(jsonData[level]) || jsonData[level].length === 0) {
      throw new Error(`Level '${level}' is either empty or not a valid array.`);
    }

    if (!(key in jsonData[level][0])) {
      throw new Error(`Key '${key}' does not exist in objects inside '${level}'.`);
    }

    const listOfIds = jsonData[level].map(item => item[key]);
    const listOfUniqueIds = new Set(listOfIds);
    const totalIds = listOfIds.length;
    const totalUniques = listOfUniqueIds.size;

    pm.test(
      `Has unique values of '${key}' at '${level}': ${totalIds} items, ${totalUniques} unique`,
      () => {
        pm.expect(totalIds).to.eql(
          totalUniques,
          `Found ${totalIds} items, but only ${totalUniques} are unique.`
        );
      }
    );
  } catch (error) {
    pm.test(`checkUniques() failed for '${level}.${key}'`, () => {
      console.error('checkUniques() - Raw response:', pm.response.text());
      pm.expect.fail(`Unable to process response: ${error.message}`);
    });
  }
}

/**
 * Kontroluje JSON odpovědi na obsah unikátních hodnot v cestě pathLevel.key
 * Cesta pathLevel může odkazovat hlouběji do objektu pomocí tečkové notace viz příklad
 * 
 * @param {string} levelPath - odkaz na název pole v JSON pomocí tečkové notace  
 * @param {string} key - klíč, jehož hodnoty budou podrobeny kontrole unikátnosti
 * 
 * @example 
 * // Testuje unikátnost klíče 'id' v poli 'branches' na základní první úrovni objektu:
 * checkUniquesInPath('branches', 'id');
 * 
 * // Testuje unikátnost klíče 'date' v poli 'availability' vnořeném hlouběji v objektu:
 * checkUniquesInPath('catalogItems.branches.availability', 'date') 
 */
function checkUniquesInPath(pathLevel, key) {
  let testName = `Has unique values of '${key}' at path '${pathLevel}': `;
  
  try {
    const jsonData = pm.response.json();
    const pathParts = pathLevel.split('.');
    const values = collectValues(jsonData, pathParts, key); // použití pomocné funkce
    const uniqueValues = new Set(values);

    const numberOfValues = values.length;
    const numberOfUniqueValues = uniqueValues.size;

    testName = testName + `${numberOfValues} values, ${numberOfUniqueValues} unique`;

    // Samostatný test s výpisem do názvu
    pm.test(testName, () => {
      pm.expect(numberOfValues, `No values found at path '${pathLevel}' with key '${key}'`).to.be.above(0);
      pm.expect(numberOfValues).to.eql(
        numberOfUniqueValues,
        `Values at path '${pathLevel}' with key '${key}' are not unique.`
      );
    });

  } catch (error) {
    // Zvláštní test jen pro error, aby se zobrazil FAIL v test reportu
    pm.test(`${testName} - Failed`, () => {
      console.error('checkUniquesInPath() - Raw response:', pm.response.text());
      pm.expect.fail(`Unable to process response: ${error.message}`);
    });
  }

  // Pomocná funkce pro průchod cestou a získání hodnot
  function collectValues(data, pathParts, key) {
    let current = [data];

    for (const part of pathParts) {
      const next = [];

      current.forEach((item) => {
        if (!item) return;

        const value = item[part];

        if (Array.isArray(value)) {
          next.push(...value);
        } else if (value !== undefined) {
          next.push(value);
        }
      });

      current = next;
    }

    return current
      .filter((item) => item && item[key] !== undefined)
      .map((item) => item[key]);
  }
}

/**
 * Testuje situaci, kdy vracíme prázdné pole při nenalezení dat.
 * 
 * @param {string} fieldName - název pole s daty v odpovědi
 * 
 * @example 
 * // Testuje pole priceChangedProducts na to, že je prázdné
 * checkEmptyArrayField(priceChangedProducts);
 */
function checkEmptyArrayField(fieldName) {
  try {
    const body = pm.response.json();
    pm.test(`Field '${fieldName}' is empty array`, () => {
      pm.expect(body).to.have.property(fieldName);
      pm.expect(body[fieldName]).to.be.an('array');
      pm.expect(body[fieldName].length).to.eql(0);
    });
  } catch (error) {
    console.error(`checkEmptyArrayField('${fieldName}') failed:`, error.message);
    pm.test(`Error in checkEmptyArrayField('${fieldName}')`, () => {
      pm.expect.fail(error.message);
    });
  }
}

/**
 * Use module.exports to export the functions that should be
 * available to use from this package.
 * module.exports = { <your_function> }
 *
 * Once exported, use this statement in your scripts to use the package.
 * const myPackage = pm.require('<package_name>')
 */
module.exports = {
  checkResponseStatus,
  checkResponseJson,
  checkResponseProperty,
  checkUniques,
  checkLocationHeader,
  checkEmptyResponse,
  checkNotEmptyResponse,
  checkResponseTime,
  checkResponseHeader,
  compareRequestResponse,
  checkHardEnter,
  checkInvalidCharacters,
  checkUniquesInPath,
  visualizeJson,
  checkRegexMatch,
  checkResponseBodyJsonSchema,
  checkRequestBodyJsonSchema,
  checkEmptyArrayField
};