import React, { useState } from "react";
import axios from "axios";
import { API } from "../config"; // => export const API = "http://localhost:3001";

export default function ClienteForm({ onSuccess }) {
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [telefono, setTelefono] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(`${API}/clientes`, {
        nombre,
        email,
        telefono: telefono || null,
      }, {
        headers: { "Content-Type": "application/json" }
      });

      // OK
      setNombre("");
      setEmail("");
      setTelefono("");
      onSuccess?.();
      console.log("Cliente creado:", res.data);
    } catch (err) {
      // Log útil para depurar
      console.error("Error creando cliente =>",
        err?.response?.status,
        err?.response?.data || err?.message
      );
      alert(`Error creando cliente: ${err?.response?.data?.error || err.message}`);
    }
  };

  return (
    <form onSubmit={submit} style={{ marginBottom: 10 }}>
      <input
        value={nombre}
        onChange={(e) => setNombre(e.target.value)}
        placeholder="Nombre"
        required
      />
      <input
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
        type="email"
        required
      />
      <input
        value={telefono}
        onChange={(e) => setTelefono(e.target.value)}
        placeholder="Teléfono (opcional)"
      />
      <button type="submit">Registrar Cliente</button>
    </form>
  );
}
