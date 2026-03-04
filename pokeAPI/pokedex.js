let allPokemons = [];

async function loadPokedex() {
  try {
    // Obtener la lista de Pokémon (todos)
    const response = await fetch(
      "https://pokeapi.co/api/v2/pokemon?limit=1000",
    );
    const data = await response.json();

    // Obtener detalles de cada Pokémon
    const pokemonPromises = data.results.map((pokemon) =>
      fetch(pokemon.url).then((res) => res.json()),
    );

    allPokemons = await Promise.all(pokemonPromises);

    // Renderizar las tarjetas
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
    card.innerHTML = `
      <h2>${pokemon.name}</h2>
      <img src="${pokemon.sprites.front_default}" alt="${pokemon.name}">
      <p>ID: ${pokemon.id}</p>
      <p>Tipos: ${types}</p>
      <p>Altura: ${pokemon.height / 10} m</p>
      <p>Peso: ${pokemon.weight / 10} kg</p>
    `;
    container.appendChild(card);
  });
}

document.getElementById("search").addEventListener("input", (e) => {
  const query = e.target.value.toLowerCase();
  const filtered = allPokemons.filter((pokemon) =>
    pokemon.name.toLowerCase().includes(query),
  );
  renderPokemons(filtered);
});

loadPokedex();
