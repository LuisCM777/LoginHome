let allPokemons = [];
let selectedPokemon1 = null;
let selectedPokemon2 = null;

async function loadPokedex() {
  try {
    const response = await fetch(
      "https://pokeapi.co/api/v2/pokemon?limit=1300",
    );
    const data = await response.json();

    const pokemonPromises = data.results.map((pokemon) =>
      fetch(pokemon.url).then((res) => res.json()),
    );

    allPokemons = await Promise.all(pokemonPromises);

    renderPokemons(allPokemons);
  } catch (error) {
    document.getElementById("pokedex").innerText = "Error al cargar la Pokédex";
    console.error(error);
  }
}

function renderPokemons(pokemons) {
  const container = document.getElementById("pokedex");
  container.innerHTML = "";

  pokemons.forEach((pokemon) => {
    const types = pokemon.types.map((t) => t.type.name).join(", ");
    const card = document.createElement("div");
    card.className = "card";

    if (selectedPokemon1 && selectedPokemon1.id === pokemon.id) {
      card.classList.add("selected-1");
    }
    if (selectedPokemon2 && selectedPokemon2.id === pokemon.id) {
      card.classList.add("selected-2");
    }

    card.innerHTML = `
      <h2>${pokemon.name}</h2>
      <img src="${pokemon.sprites.front_default}" alt="${pokemon.name}">
      <p>ID: ${pokemon.id}</p>
      <p>Tipos: ${types}</p>
      <p>Altura: ${pokemon.height / 10} m</p>
      <p>Peso: ${pokemon.weight / 10} kg</p>
      <button class="select-btn" data-slot="1">Elegir Pokemon 1</button>
      <button class="select-btn" data-slot="2">Elegir Pokemon 2</button>
    `;

    card.querySelectorAll(".select-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const slot = btn.dataset.slot;
        selectPokemon(pokemon, slot);
      });
    });

    container.appendChild(card);
  });

  updateBattleStatus();
}

function selectPokemon(pokemon, slot) {
  if (slot === "1") {
    if (selectedPokemon2 && selectedPokemon2.id === pokemon.id) {
      alert("No puedes seleccionar el mismo Pokémon para los dos jugadores.");
      return;
    }
    selectedPokemon1 = pokemon;
  } else {
    if (selectedPokemon1 && selectedPokemon1.id === pokemon.id) {
      alert("No puedes seleccionar el mismo Pokémon para los dos jugadores.");
      return;
    }
    selectedPokemon2 = pokemon;
  }

  renderPokemons(allPokemons);
  renderBattleSprites();
}

function getStat(pokemon, statName) {
  const stat = pokemon.stats.find((s) => s.stat.name === statName);
  return stat ? stat.base_stat : 0;
}

function chooseMoveName(pokemon) {
  if (!pokemon.moves || pokemon.moves.length === 0) return "ataque básico";
  const randomIndex = Math.floor(Math.random() * pokemon.moves.length);
  return pokemon.moves[randomIndex].move.name.replace("-", " ");
}

function updateBattleStatus() {
  document.getElementById("selected1").innerText = selectedPokemon1
    ? selectedPokemon1.name
    : "-";
  document.getElementById("selected2").innerText = selectedPokemon2
    ? selectedPokemon2.name
    : "-";

  document.getElementById("hp1Name").innerText = selectedPokemon1
    ? selectedPokemon1.name
    : "-";
  document.getElementById("hp2Name").innerText = selectedPokemon2
    ? selectedPokemon2.name
    : "-";
  if (!selectedPokemon1 || !selectedPokemon2) {
    document.getElementById("hpBar1").value = 0;
    document.getElementById("hpBar2").value = 0;
    document.getElementById("hp1Text").innerText = "0/0";
    document.getElementById("hp2Text").innerText = "0/0";
  }

  const battleBtn = document.getElementById("battleButton");
  battleBtn.disabled = !(selectedPokemon1 && selectedPokemon2);

  document.getElementById("winnerDisplay").innerHTML = "";
}

function renderBattleSprites() {
  const container = document.getElementById("battleSprites");
  if (!selectedPokemon1 || !selectedPokemon2) {
    container.innerHTML = "";
    return;
  }

  const leftSprite = selectedPokemon1.sprites.other.showdown.front_default;
  const rightSprite = selectedPokemon2.sprites.other.showdown.front_default;

  container.innerHTML = `
    <img src="${leftSprite}" class="sprite-left" alt="${selectedPokemon1.name} espalda" />
    <img src="${rightSprite}" class="sprite-right" alt="${selectedPokemon2.name} frente" />
  `;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function startBattle() {
  if (!selectedPokemon1 || !selectedPokemon2) return;

  const battleBtn = document.getElementById("battleButton");
  battleBtn.disabled = true;

  renderBattleSprites();
  const resultElem = document.getElementById("battleResult");
  const winnerDiv = document.getElementById("winnerDisplay");
  resultElem.innerText = "";
  winnerDiv.innerHTML = "";

  const hp1 = getStat(selectedPokemon1, "hp");
  const hp2 = getStat(selectedPokemon2, "hp");

  const fighter1 = {
    pokemon: selectedPokemon1,
    hp: hp1,
    maxHp: hp1,
    attack: getStat(selectedPokemon1, "attack"),
    defense: getStat(selectedPokemon1, "defense"),
    speed: getStat(selectedPokemon1, "speed"),
  };
  const fighter2 = {
    pokemon: selectedPokemon2,
    hp: hp2,
    maxHp: hp2,
    attack: getStat(selectedPokemon2, "attack"),
    defense: getStat(selectedPokemon2, "defense"),
    speed: getStat(selectedPokemon2, "speed"),
  };

  // inicializar barras de vida
  document.getElementById("hp1Name").innerText = fighter1.pokemon.name;
  document.getElementById("hp2Name").innerText = fighter2.pokemon.name;
  function updateHpBars() {
    const pct1 = Math.floor((fighter1.hp / fighter1.maxHp) * 100);
    const pct2 = Math.floor((fighter2.hp / fighter2.maxHp) * 100);
    document.getElementById("hpBar1").value = pct1;
    document.getElementById("hpBar2").value = pct2;
    document.getElementById("hp1Text").innerText =
      `${fighter1.hp}/${fighter1.maxHp}`;
    document.getElementById("hp2Text").innerText =
      `${fighter2.hp}/${fighter2.maxHp}`;
  }
  updateHpBars();

  let attacker = fighter1.speed >= fighter2.speed ? fighter1 : fighter2;
  let defender = attacker === fighter1 ? fighter2 : fighter1;

  resultElem.innerText += `Batalla: ${fighter1.pokemon.name} vs ${fighter2.pokemon.name}\n`;

  for (let turn = 1; turn <= 10; turn++) {
    if (fighter1.hp <= 0 || fighter2.hp <= 0) break;

    resultElem.innerText += `\nTurno ${turn}: ${attacker.pokemon.name} ataca a ${defender.pokemon.name}`;
    resultElem.innerText += ` (HP ${fighter1.hp}/${fighter1.maxHp} - ${fighter2.hp}/${fighter2.maxHp})\n`;

    const moveName = chooseMoveName(attacker.pokemon);
    const dodgeChance = Math.random();
    const speedRatio = Math.max(
      0,
      Math.min(1, (defender.speed - attacker.speed + 50) / 100),
    );
    const isDodged = dodgeChance < 0.2 * speedRatio;

    if (isDodged) {
      resultElem.innerText += `${defender.pokemon.name} esquiva el ataque de ${attacker.pokemon.name} con ${moveName}!\n`;
    } else {
      let baseDamage = attacker.attack * (Math.random() * 0.3 + 0.85);
      let rawDamage = Math.max(
        1,
        Math.round(baseDamage - defender.defense * 0.25),
      );

      // posibilidad de ataque especial después de 3 turnos
      if (turn >= 3 && Math.random() < 0.4) {
        resultElem.innerText += `${attacker.pokemon.name} intenta un ataque especial...\n`;
        if (Math.random() < 0.3) {
          resultElem.innerText += `¡El ataque especial falla!\n`;
          rawDamage = 0;
        } else {
          rawDamage = Math.round(rawDamage * 1.5);
          resultElem.innerText += `¡Es un impacto especial! daño aumentado a ${rawDamage}.\n`;
        }
      }

      // posibilidad de defensa especial después de 2 turnos
      if (turn >= 2 && rawDamage > 0 && Math.random() < 0.4) {
        resultElem.innerText += `${defender.pokemon.name} intenta una defensa especial...\n`;
        if (Math.random() < 0.3) {
          resultElem.innerText += `¡La defensa especial falla!\n`;
        } else {
          rawDamage = Math.floor(rawDamage / 2);
          resultElem.innerText += `¡Defensa activa! daño reducido a ${rawDamage}.\n`;
        }
      }

      defender.hp = Math.max(0, defender.hp - rawDamage);
      if (rawDamage > 0) {
        resultElem.innerText += `${attacker.pokemon.name} inflige ${rawDamage} de daño. ${defender.pokemon.name} queda con ${defender.hp} HP.\n`;
      }
      updateHpBars();
    }

    if (defender.hp <= 0) {
      resultElem.innerText += `${defender.pokemon.name} ha sido debilitado.\n`;
      break;
    }

    [attacker, defender] = [defender, attacker];

    await sleep(1000);
  }

  if (fighter1.hp <= 0 && fighter2.hp <= 0) {
    resultElem.innerText += "\nEmpate! Ambos Pokémon se debilitaron.\n";
  } else if (fighter1.hp <= 0) {
    resultElem.innerText += `\nGanador: ${fighter2.pokemon.name} (HP restante ${fighter2.hp}).\n`;
  } else if (fighter2.hp <= 0) {
    resultElem.innerText += `\nGanador: ${fighter1.pokemon.name} (HP restante ${fighter1.hp}).\n`;
  } else {
    if (fighter1.hp > fighter2.hp) {
      resultElem.innerText += `\nGanador por puntos: ${fighter1.pokemon.name} (${fighter1.hp} vs ${fighter2.hp}).\n`;
    } else if (fighter2.hp > fighter1.hp) {
      resultElem.innerText += `\nGanador por puntos: ${fighter2.pokemon.name} (${fighter2.hp} vs ${fighter1.hp}).\n`;
    } else {
      resultElem.innerText += `\nEmpate por puntos: ${fighter1.hp} vs ${fighter2.hp}.\n`;
    }
  }

  // mostrar foto del ganador si hay uno claro
  const winnerDiv2 = document.getElementById("winnerDisplay");
  let winnerPokemon = null;
  if (fighter1.hp > fighter2.hp) winnerPokemon = fighter1.pokemon;
  else if (fighter2.hp > fighter1.hp) winnerPokemon = fighter2.pokemon;
  if (winnerPokemon) {
    const imgSrc = winnerPokemon.sprites.other['official-artwork'].front_default;

    winnerDiv2.innerHTML = `<div class="caption">GANADOR</div><img src="${imgSrc}" alt="${winnerPokemon.name}" />`;
  }

  document.getElementById("battleButton").disabled = false;
}

document.getElementById("search").addEventListener("input", (e) => {
  const query = e.target.value.toLowerCase();
  const filtered = allPokemons.filter((pokemon) =>
    pokemon.name.toLowerCase().includes(query),
  );
  renderPokemons(filtered);
});

document.getElementById("battleButton").addEventListener("click", startBattle);

loadPokedex();
