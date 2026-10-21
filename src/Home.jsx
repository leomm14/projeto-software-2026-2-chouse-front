import { useAuth0 } from "@auth0/auth0-react";
import React, { useEffect, useState } from "react";
import LoginButton from "./LoginButton";
import LogoutButton from "./LogoutButton";

const API_URL = "/api";

export default function Home({ onNavigate, dbUser, setDbUser }) {
  const [token, setToken] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [novoNome, setNovoNome] = useState("");
  const [loadingUser, setLoadingUser] = useState(false);
  const [mensagem, setMensagem] = useState("");
  const [erro, setErro] = useState("");

  const {
    user,
    isAuthenticated,
    getAccessTokenSilently
  } = useAuth0();

  useEffect(() => {
    const fetchTokenAndSyncUser = async () => {
      try {
        setLoadingUser(true);
        setErro("");
        const accessToken = await getAccessTokenSilently();
        setToken(accessToken);

        const payload = JSON.parse(atob(accessToken.split(".")[1]));
        const roles = payload["https://social-insper.com/roles"] || [];
        setIsAdmin(roles.includes("ADMIN"));

        // Sincronizar usuário no chouse-user (Buscar por Auth0 ID ou Criar se 404)
        const encodedSub = encodeURIComponent(user.sub);
        let res = await fetch(`${API_URL}/usuarios/auth0/${encodedSub}`, {
          headers: {
            "Authorization": `Bearer ${accessToken}`
          }
        });

        if (res.status === 404) {
          res = await fetch(`${API_URL}/usuarios`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${accessToken}`
            },
            body: JSON.stringify({
              auth0Id: user.sub,
              nome: user.name || user.nickname || "Usuário",
              email: user.email
            })
          });
        }

        if (res.ok) {
          const userData = await res.json();
          setDbUser(userData);
          setNovoNome(userData.nome);
        } else {
          setErro("Não foi possível carregar ou registrar o usuário no User Service.");
        }
      } catch (e) {
        console.error("Erro ao sincronizar:", e);
        setErro("Erro de conexão com o servidor.");
      } finally {
        setLoadingUser(false);
      }
    };

    if (isAuthenticated && user) {
      fetchTokenAndSyncUser();
    }
  }, [isAuthenticated, user, getAccessTokenSilently, setDbUser]);

  const handleAtualizarPerfil = async (e) => {
    e.preventDefault();
    if (!dbUser || !novoNome.trim()) return;

    try {
      setErro("");
      setMensagem("");
      const res = await fetch(`${API_URL}/usuarios/${dbUser.id}/perfil`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ nome: novoNome })
      });

      if (!res.ok) {
        throw new Error("Erro ao atualizar o nome do perfil.");
      }

      const atualizado = await res.json();
      setDbUser(atualizado);
      setMensagem("Perfil atualizado com sucesso!");
    } catch (err) {
      setErro(err.message);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 text-gray-800 p-6">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
          <h1 className="text-4xl font-bold mb-2 text-blue-600">Consenso</h1>
          <p className="text-gray-600 mb-6">Plataforma de enquetes e jogo de adivinhação.</p>
          <LoginButton />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 bg-gray-50 font-sans text-left text-gray-800">
      <div className="max-w-4xl mx-auto">
        {/* Navigation Menu */}
        <div className="bg-white rounded-2xl shadow p-4 mb-6">
          <nav className="flex gap-4">
            <button
              onClick={() => onNavigate('home')}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 font-medium"
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
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 font-medium"
            >
              Modo Adivinhação (Jogo)
            </button>
          </nav>
        </div>

        {erro && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
            {erro}
          </div>
        )}

        {mensagem && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded mb-6">
            {mensagem}
          </div>
        )}

        {/* User Profile Section */}
        <div className="bg-white rounded-2xl shadow p-6 mb-6">
          <div className="flex items-center gap-4">
            <img
              src={user.picture}
              alt={user.name}
              className="w-16 h-16 rounded-full"
            />
            <div className="flex-1">
              <h1 className="text-3xl font-bold">{dbUser ? dbUser.nome : user.name}</h1>
              <p className="text-gray-600">{user.email}</p>
              <div className="flex gap-2 mt-2">
                {isAdmin && (
                  <span className="inline-block px-3 py-1 bg-blue-500 text-white text-sm rounded font-medium">
                    Admin
                  </span>
                )}
                {dbUser && (
                  <span className="inline-block px-3 py-1 bg-amber-500 text-white text-sm rounded font-bold">
                    🏆 Pontuação Total: {dbUser.pontuacaoTotal} pts
                  </span>
                )}
              </div>
            </div>
            <LogoutButton />
          </div>

          {/* Form para Atualizar Perfil no User Service */}
          {dbUser && (
            <form onSubmit={handleAtualizarPerfil} className="mt-6 pt-6 border-t border-gray-100 flex gap-3 items-end">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Atualizar Nome no Perfil (User Service - ID #{dbUser.id})
                </label>
                <input
                  type="text"
                  value={novoNome}
                  onChange={(e) => setNovoNome(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <button
                type="submit"
                className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 font-medium"
              >
                Salvar Nome
              </button>
            </form>
          )}
          {loadingUser && <p className="text-sm text-gray-500 mt-4">Sincronizando com User Service...</p>}
        </div>

        {/* JWT Token Section */}
        <div className="bg-white rounded-2xl shadow p-6">
          <h2 className="text-xl font-bold mb-4">Token JWT (Auth0)</h2>
          <div className="bg-gray-100 p-4 rounded border border-gray-300">
            <p className="text-sm text-gray-600 mb-2 font-semibold">Access Token:</p>
            <code className="block text-xs break-all font-mono text-gray-800 max-h-32 overflow-y-auto">
              {token || "Carregando..."}
            </code>
          </div>

          {token && (
            <div className="mt-4">
              <p className="text-sm text-gray-600 mb-2 font-semibold">Payload Decodificado:</p>
              <pre className="bg-gray-100 p-4 rounded border border-gray-300 text-xs overflow-x-auto max-h-40 overflow-y-auto">
                {JSON.stringify(
                  JSON.parse(atob(token.split(".")[1])),
                  null,
                  2
                )}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
