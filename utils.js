/**
 * Vygeneruje náhodný EAN13 včetně kontrolního čísla
 * @return {string}
 */
function generateEAN13() {
  let ean = [];

  // Generuje prvních 12 číslic
  for (let i = 0; i < 12; i++) {
    ean.push(Math.floor(Math.random() * 10));
  }

  // Výpočet kontrolní číslice (Luhnův algoritmus pro EAN-13)
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    sum += i % 2 === 0 ? ean[i] : ean[i] * 3;
  }

  let checkDigit = (10 - (sum % 10)) % 10;
  ean.push(checkDigit);

  return ean.join(''); // vrací string
}

/**
 * Generuje náhodný email z předem připravených seznamů.
 * @returns {string} Náhodný email
 */
function generateEmail() {
  const names = [
    'bilbo',
    'gandalf',
    'boromir',
    'aragorn',
    'pipin',
    'samved',
    'elrond',
    'galadriel',
    'sauron',
    'saruman',
    'smelmir',
    'durin',
    'legolas',
    'gimli',
    'frodo',
  ];
  const domains = [
    'mordor',
    'roklinka',
    'harad',
    'moria',
    'kraj',
    'run',
    'gondor',
    'rohan',
  ];
  const sites = ['com', 'cz', 'sk', 'info', 'eu'];

  const randomName = names[Math.floor(Math.random() * names.length)];
  const randomNumber = Math.floor(Math.random() * 1000); // přidá číslo pro unikátnost
  const randomDomainName = domains[Math.floor(Math.random() * domains.length)];
  const randomDomainSite = sites[Math.floor(Math.random() * sites.length)];

  return `${randomName}-${randomNumber}@${randomDomainName}.${randomDomainSite}`;
}

/**
 * Vygeneruje náhodné telefonní číslo s předvolbou +420 nebo +421 ve formátu +420123456789
 */
function generatePhone() {
  const prefix = ['+420', '+421'];

  const randomPrefix = prefix[Math.floor(Math.random() * prefix.length)];
  const randomNumber = Math.floor(100000000 + Math.random() * 900000000);

  return `${randomPrefix}${randomNumber}`;
}

/**
 * Generuje náhodné jméno.
 * @returns {string} Náhodné jméno.
 */
function generateFirstName() {
  const firstNames = [
    'Jan',
    'Petr',
    'Martin',
    'David',
    'Jakub',
    'Tomáš',
    'Lukáš',
    'Michal',
    'Filip',
    'Ondřej',
  ];

  return firstNames[Math.floor(Math.random() * firstNames.length)];
}

/**
 * Generuje náhodné příjmení.
 * @returns {string} Náhodné příjmení.
 */
function generateLastName() {
  const lastNames = [
    'Novák',
    'Svoboda',
    'Dvořák',
    'Černý',
    'Procházka',
    'Kučera',
    'Veselý',
    'Horák',
    'Marek',
    'Pospíšil',
  ];

  return lastNames[Math.floor(Math.random() * lastNames.length)];
}

/**
 * Generuje náhodné celé číslo v rozsahu 1 - maxNumber.
 * @param {number} maxNumber - Maximální hodnota čísla pro generování. 
 * @returns {number} Vrací náhodné celé číslo.
 */
function generateRandomNumber(maxNumber) {
  try {
    if (!Number.isInteger(maxNumber)) {
    throw new Error('maxNumber must be an integer')
    }

    if (maxNumber < 1) {
      throw new Error('maxNumber must be 1 or greater!');
    }
    
    return Math.floor(Math.random() * maxNumber) + 1;
  } catch (error) {
    console.error(`Error at function generateRandomNumber(): ${error.message}`);
    return null;
  }
}

/**
 * Při každém spuštění iteruje pole hodnot podle globální proměnné a doplní hodnotu do proměnné dotazu.
 * @param {string} requestVariable - proměnná v dotazu, kterou chci doplnit specifickou hodnotou.
 * @param {string} counterVariable - globální proměnná sloužící pro inkrementaci indexů.
 * @param {Array} valuesArray - pole hodnot, které chceme proiterovat a při každém spuštění testu postupně doplnit.  
 */
function iterateThroughArray(requestVariable, counterVariable, valuesArray) {
    // Získání aktuálního indexu, pokud neexistuje, nastaví se na 0
    let counter = pm.globals.get(counterVariable) ? parseInt(pm.globals.get(counterVariable)) : 0;

    // Kontrola, zda jsme nepřekročili délku pole
    if (counter >= valuesArray.length) {
        counter = 0; // Reset na začátek
        
    }

    // Nastavení aktuální hodnoty podle indexu v poli
    let selectedValue = valuesArray[counter];

    // Počet zbývajících iterací před resetem
    let remainingIterations = valuesArray.length - counter - 1;

    // Logování informací
    console.log(`🔄 Aktuální hodnota ${requestVariable}: ${selectedValue}`);
    console.log(`⏳ Zbývá iterací před resetem: ${remainingIterations}`);

    // Zvýšení indexu pro další iteraci
    counter++;
    if (counter >= valuesArray.length) {
      console.log('💥 Konec iterací 💥');
    }

    // Uložení indexu zpět do globálních proměnných
    pm.globals.set(counterVariable, counter);

    // Uložení hodnoty do lokální proměnné (pro použití v requestu)
    pm.variables.set(requestVariable, selectedValue);
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
  generateEAN13,
  generateEmail,
  generatePhone,
  generateFirstName,
  generateLastName,
  generateRandomNumber,
  iterateThroughArray
};
