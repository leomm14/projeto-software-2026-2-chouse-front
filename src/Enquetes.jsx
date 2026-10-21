import { useAuth0 } from "@auth0/auth0-react";
import React, { useEffect, useState } from "react";
import LogoutButton from "./LogoutButton";

const API_URL = "/api";

export default function Enquetes({ onNavigate, dbUser }) {
  const { isAuthenticated, getAccessTokenSilently } = useAuth0();
  const [enquetes, setEnquetes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [token, setToken] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);

  const [formData, setFormData] = useState({
    pergunta: "",
    categoria: "",
    textoA: "",
    textoB: "",
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const init = async () => {
      try {
        const accessToken = await getAccessTokenSilently();
        setToken(accessToken);
        const payload = JSON.parse(atob(accessToken.split(".")[1]));
        const roles = payload["https://social-insper.com/roles"] || [];
        setIsAdmin(roles.includes("ADMIN"));
      } catch (e) {
        console.error("Erro ao buscar token:", e);
      }
    };
    if (isAuthenticated) {
      init();
    }
  }, [isAuthenticated, getAccessTokenSilently]);

  useEffect(() => {
    fetchEnquetes();
  }, [token]);

  const fetchEnquetes = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await fetch(`${API_URL}/enquetes`, {
        headers: token ? { "Authorization": `Bearer ${token}` } : {}
      });
      if (!response.ok) {
        throw new Error("Erro ao buscar enquetes");
      }
      const data = await response.json();
      setEnquetes(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleCriarEnquete = async (e) => {
    e.preventDefault();
    if (!formData.pergunta || !formData.textoA || !formData.textoB) {
      setError("Pergunta e as duas opções são obrigatórias.");
      return;
    }

    try {
      setSubmitting(true);
      setError("");
      setSuccessMsg("");

      const response = await fetch(`${API_URL}/enquetes`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error("Erro ao criar enquete. Verifique se as opções são diferentes.");
      }

      const novaEnquete = await response.json();
      setEnquetes((prev) => [...prev, novaEnquete]);
      setFormData({ pergunta: "", categoria: "", textoA: "", textoB: "" });
      setSuccessMsg("Enquete criada com sucesso!");
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleVotar = async (enqueteId, opcaoId) => {
    if (!dbUser) {
      setError("Usuário não sincronizado no banco. Volte na aba Home primeiro.");
      return;
    }

    try {
      setError("");
      setSuccessMsg("");
      const response = await fetch(`${API_URL}/enquetes/${enqueteId}/votos`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          usuarioId: dbUser.id,
          opcaoId: opcaoId
        }),
      });

      if (response.status === 409) {
        throw new Error("Você já votou nesta enquete ou ela não está ativa!");
      }
      if (!response.ok) {
        throw new Error("Erro ao registrar voto.");
      }

      setSuccessMsg("Voto registrado com sucesso! (Os percentuais ficam ocultos no Modo Votação)");
      fetchEnquetes();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleEncerrar = async (enqueteId) => {
    try {
      setError("");
      setSuccessMsg("");
      const response = await fetch(`${API_URL}/enquetes/${enqueteId}/encerrar`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error("Erro ao encerrar enquete.");
      }

      setSuccessMsg("Enquete encerrada!");
      fetchEnquetes();
    } catch (err) {
      setError(err.message);
    }
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
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 font-medium"
            >
              Modo Votação (Enquetes)
            </button>
            <button
              onClick={() => onNavigate('jogo')}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 font-medium"
            >
              Modo Adivinhação (Jogo)
            </button>
          </nav>
        </div>

        {/* Header */}
        <div className="bg-white rounded-2xl shadow p-6 mb-6 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Modo Votação — Enquetes</h1>
            <p className="text-gray-600 text-sm mt-1">
              Escolha a opção que reflete sua preferência pessoal. O percentual não é revelado ao votar!
            </p>
          </div>
          <LogoutButton />
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        {successMsg && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded mb-6">
            {successMsg}
          </div>
        )}

        {/* Form Criar Enquete */}
        <div className="bg-white rounded-2xl shadow p-6 mb-6">
          <h2 className="text-xl font-bold mb-4">Criar Nova Enquete</h2>
          <form onSubmit={handleCriarEnquete} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Pergunta / Confronto
                </label>
                <input
                  type="text"
                  name="pergunta"
                  value={formData.pergunta}
                  onChange={handleInputChange}
                  placeholder="Ex: Biscoito ou Bolacha?"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Categoria
                </label>
                <input
                  type="text"
                  name="categoria"
                  value={formData.categoria}
                  onChange={handleInputChange}
                  placeholder="Ex: COTIDIANO (Opcional)"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Opção A
                </label>
                <input
                  type="text"
                  name="textoA"
                  value={formData.textoA}
                  onChange={handleInputChange}
                  placeholder="Ex: Biscoito"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Opção B
                </label>
                <input
                  type="text"
                  name="textoB"
                  value={formData.textoB}
                  onChange={handleInputChange}
                  placeholder="Ex: Bolacha"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 disabled:bg-gray-400 font-medium"
            >
              {submitting ? "Criando..." : "Publicar Enquete"}
            </button>
          </form>
        </div>

        {/* Lista de Enquetes */}
        <div className="bg-white rounded-2xl shadow p-6">
          <h2 className="text-xl font-bold mb-4">Enquetes Disponíveis</h2>

          {loading ? (
            <p className="text-gray-600">Carregando enquetes...</p>
          ) : enquetes.length === 0 ? (
            <p className="text-gray-600">Nenhuma enquete cadastrada ainda.</p>
          ) : (
            <div className="grid gap-4">
              {enquetes.map((enquete) => (
                <div
                  key={enquete.id}
                  className="border border-gray-200 rounded-xl p-5 hover:shadow-md transition"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <span className="text-xs font-bold uppercase tracking-wider px-2 py-1 bg-gray-100 text-gray-600 rounded mr-2">
                        {enquete.categoria}
                      </span>
                      <span
                        className={`text-xs font-bold px-2 py-1 rounded ${
                          enquete.status === "ATIVA"
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {enquete.status}
                      </span>
                    </div>

                    {enquete.status === "ATIVA" && (
                      <button
                        onClick={() => handleEncerrar(enquete.id)}
                        className="text-xs px-3 py-1 bg-gray-200 hover:bg-red-100 hover:text-red-700 text-gray-700 rounded transition"
                      >
                        Encerrar Enquete
                      </button>
                    )}
                  </div>

                  <h3 className="text-xl font-bold text-gray-900 mb-4">
                    {enquete.pergunta}
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {enquete.opcoes &&
                      enquete.opcoes.map((opcao) => (
                        <button
                          key={opcao.id}
                          disabled={enquete.status !== "ATIVA"}
                          onClick={() => handleVotar(enquete.id, opcao.id)}
                          className="py-3 px-4 border-2 border-blue-500 text-blue-600 font-semibold rounded-xl hover:bg-blue-500 hover:text-white disabled:border-gray-300 disabled:text-gray-400 disabled:hover:bg-transparent transition"
                        >
                          Votar em: {opcao.texto}
                        </button>
                      ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
