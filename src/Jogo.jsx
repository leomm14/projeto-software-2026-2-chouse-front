import { useAuth0 } from "@auth0/auth0-react";
import React, { useEffect, useState } from "react";
import LogoutButton from "./LogoutButton";

const API_URL = "/api";

export default function Jogo({ onNavigate, dbUser, setDbUser }) {
  const { isAuthenticated, getAccessTokenSilently } = useAuth0();
  const [enquetes, setEnquetes] = useState([]);
  const [palpites, setPalpites] = useState([]);
  const [resultados, setResultados] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [feedback, setFeedback] = useState(null);
  const [token, setToken] = useState("");

  useEffect(() => {
    const init = async () => {
      try {
        const accessToken = await getAccessTokenSilently();
        setToken(accessToken);
      } catch (e) {
        console.error("Erro ao buscar token:", e);
      }
    };
    if (isAuthenticated) {
      init();
    }
  }, [isAuthenticated, getAccessTokenSilently]);

  useEffect(() => {
    if (dbUser) {
      fetchDadosDoJogo();
    } else {
      setLoading(false);
    }
  }, [token, dbUser]);

  const fetchDadosDoJogo = async () => {
    try {
      setLoading(true);
      setError("");

      // 1. Buscar todas as enquetes
      const enqRes = await fetch(`${API_URL}/enquetes`, {
        headers: token ? { "Authorization": `Bearer ${token}` } : {}
      });
      if (!enqRes.ok) throw new Error("Erro ao buscar enquetes");
      const enqData = await enqRes.json();
      setEnquetes(enqData);

      // 2. Buscar histórico de palpites do usuário no chouse-game
      const palpRes = await fetch(`${API_URL}/palpites/usuario/${dbUser.id}`, {
        headers: token ? { "Authorization": `Bearer ${token}` } : {}
      });
      if (palpRes.ok) {
        const palpData = await palpRes.json();
        setPalpites(palpData);

        // Para enquetes já palpitadas, buscar o resultado (percentuais) para mostrar ao jogador
        const resultadosMap = {};
        for (const p of palpData) {
          const resEnq = await fetch(`${API_URL}/enquetes/${p.enqueteId}/resultado`, {
            headers: token ? { "Authorization": `Bearer ${token}` } : {}
          });
          if (resEnq.ok) {
            resultadosMap[p.enqueteId] = await resEnq.json();
          }
        }
        setResultados(resultadosMap);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const atualizarPontuacaoUsuario = async () => {
    if (!dbUser) return;
    try {
      const res = await fetch(`${API_URL}/usuarios/${dbUser.id}`, {
        headers: token ? { "Authorization": `Bearer ${token}` } : {}
      });
      if (res.ok) {
        const atualizado = await res.json();
        setDbUser(atualizado);
      }
    } catch (e) {
      console.error("Erro ao atualizar pontuação:", e);
    }
  };

  const handlePalpitar = async (enqueteId, opcaoId) => {
    if (!dbUser) {
      setError("Usuário não carregado. Visite a aba Home primeiro.");
      return;
    }

    try {
      setError("");
      setFeedback(null);

      const response = await fetch(`${API_URL}/palpites`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          usuarioId: dbUser.id,
          enqueteId: enqueteId,
          opcaoId: opcaoId
        }),
      });

      if (response.status === 409) {
        throw new Error("Não foi possível palpitar: você já palpitou nesta enquete ou ela ainda está empatada/sem votos suficientes.");
      }
      if (!response.ok) {
        throw new Error("Erro ao registrar palpite.");
      }

      const novoPalpite = await response.json();
      setFeedback(novoPalpite);

      // Atualiza lista de palpites, percentuais e pontuação total do usuário
      await fetchDadosDoJogo();
      await atualizarPontuacaoUsuario();
    } catch (err) {
      setError(err.message);
    }
  };

  const encontrarPalpite = (enqueteId) => {
    return palpites.find((p) => p.enqueteId === enqueteId);
  };

  if (!isAuthenticated) {
    return <div>Não autenticado</div>;
  }

  return (
    <div className="min-h-screen p-6 bg-gray-50 font-sans text-left text-gray-800">
      <div className="max-w-4xl mx-auto">
        {/* Navigation Menu */}
        <div className="bg-white rounded-2xl shadow p-4 mb-6">
          <nav className="flex gap-4">
            <button
              onClick={() => onNavigate('home')}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 font-medium"
            >
              Home & Perfil
            </button>
            <button
              onClick={() => onNavigate('enquetes')}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 font-medium"
            >
              Modo Votação (Enquetes)
            </button>
            <button
              onClick={() => onNavigate('jogo')}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 font-medium"
            >
              Modo Adivinhação (Jogo)
            </button>
          </nav>
        </div>

        {/* Header */}
        <div className="bg-white rounded-2xl shadow p-6 mb-6 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Modo Adivinhação — Jogo</h1>
            <p className="text-gray-600 text-sm mt-1">
              Tente adivinhar qual das duas opções teve mais votos da comunidade e ganhe pontos!
            </p>
          </div>
          <div className="flex items-center gap-4">
            {dbUser && (
              <span className="px-4 py-2 bg-amber-500 text-white font-bold rounded-xl shadow-sm">
                🏆 {dbUser.pontuacaoTotal} pts
              </span>
            )}
            <LogoutButton />
          </div>
        </div>

        {!dbUser && (
          <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded mb-6">
            Atenção: Volte para a página <strong>Home & Perfil</strong> para sincronizar seu usuário antes de jogar.
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        {feedback && (
          <div
            className={`border px-5 py-4 rounded-xl mb-6 ${
              feedback.acertou
                ? "bg-green-50 border-green-300 text-green-800"
                : "bg-orange-50 border-orange-300 text-orange-800"
            }`}
          >
            <h3 className="font-bold text-lg">
              {feedback.acertou
                ? `🎉 Na mosca! Você acertou o consenso e ganhou +${feedback.pontosGanhos} pontos!`
                : "😅 Quase! A maioria da comunidade escolheu a outra opção (+0 pontos)."}
            </h3>
          </div>
        )}

        {/* Enquetes para Palpitar */}
        <div className="bg-white rounded-2xl shadow p-6">
          <h2 className="text-xl font-bold mb-4">Desafios de Consenso</h2>

          {loading ? (
            <p className="text-gray-600">Carregando desafios...</p>
          ) : enquetes.length === 0 ? (
            <p className="text-gray-600">Nenhuma enquete disponível para jogar.</p>
          ) : (
            <div className="grid gap-4">
              {enquetes.map((enquete) => {
                const palpiteFeito = encontrarPalpite(enquete.id);
                const resultado = resultados[enquete.id];

                return (
                  <div
                    key={enquete.id}
                    className="border border-gray-200 rounded-xl p-5 hover:shadow-md transition"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold uppercase tracking-wider px-2 py-1 bg-purple-100 text-purple-700 rounded">
                        {enquete.categoria}
                      </span>
                      {palpiteFeito && (
                        <span
                          className={`text-xs font-bold px-3 py-1 rounded-full ${
                            palpiteFeito.acertou
                              ? "bg-green-100 text-green-700"
                              : "bg-red-100 text-red-700"
                          }`}
                        >
                          {palpiteFeito.acertou
                            ? `✅ Acertou (+${palpiteFeito.pontosGanhos} pts)`
                            : "❌ Errou (0 pts)"}
                        </span>
                      )}
                    </div>

                    <h3 className="text-xl font-bold text-gray-900 mb-4">
                      Qual opção tem mais votos? — "{enquete.pergunta}"
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {enquete.opcoes &&
                        enquete.opcoes.map((opcao, idx) => {
                          const foiEscolhida =
                            palpiteFeito && palpiteFeito.opcaoPalpitadaId === opcao.id;
                          const percentual =
                            resultado && idx === 0
                              ? resultado.percentualA
                              : resultado && idx === 1
                              ? resultado.percentualB
                              : null;

                          return (
                            <button
                              key={opcao.id}
                              disabled={!!palpiteFeito || !dbUser}
                              onClick={() => handlePalpitar(enquete.id, opcao.id)}
                              className={`py-3 px-4 border-2 rounded-xl font-semibold transition flex flex-col items-center justify-center ${
                                foiEscolhida
                                  ? "border-purple-600 bg-purple-50 text-purple-800"
                                  : palpiteFeito
                                  ? "border-gray-200 text-gray-500 bg-gray-50"
                                  : "border-purple-500 text-purple-600 hover:bg-purple-500 hover:text-white"
                              }`}
                            >
                              <span>Palpitar em: {opcao.texto}</span>
                              {percentual !== null && (
                                <span className="text-xs font-bold mt-1">
                                  Comunidade: {percentual.toFixed(1)}% dos votos
                                </span>
                              )}
                            </button>
                          );
                        })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
