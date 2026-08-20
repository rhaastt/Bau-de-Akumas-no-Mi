/* Persistência do progresso no localStorage.
 *
 * Todo o estado é salvo: mochila, Berrys, baús, descobertos e o quiz. Salvar
 * só parte deles criaria incoerência — o quiz paga Berrys, então guardar as
 * perguntas gastas e perder o saldo faria o jogador voltar no prejuízo.
 *
 * Nada aqui pode lançar: localStorage joga exceção em navegação privada e com
 * cookies bloqueados, e um throw no caminho de salvar derrubaria o jogo a cada
 * compra. O jogo tem de funcionar sem save, apenas sem lembrar.
 */

const CHAVE = "bau-de-itens:v1";

/**
 * Lê o estado salvo.
 * @returns {object|null} null quando não há save, o storage não existe ou o
 *   conteúdo está corrompido — todos os casos em que começar do zero é o certo.
 */
export function carregar() {
  try {
    const bruto = localStorage.getItem(CHAVE);
    if (!bruto) return null;
    const dados = JSON.parse(bruto);
    // JSON.parse aceita "3" e "null"; só objeto serve como estado.
    return dados && typeof dados === "object" ? dados : null;
  } catch {
    return null;
  }
}

export function salvar(estado) {
  try {
    localStorage.setItem(CHAVE, JSON.stringify(estado));
  } catch {
    // Sem espaço ou sem permissão: seguir sem salvar é melhor que quebrar.
  }
}

export function limpar() {
  try {
    localStorage.removeItem(CHAVE);
  } catch {
    // idem
  }
}
