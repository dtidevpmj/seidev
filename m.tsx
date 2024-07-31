import React, { useState, type FC } from "react"

interface ModalProps {
  cdDocto: number | null
  message: string
  onClose: () => void
}

const Modal: FC<ModalProps> = ({ cdDocto, message, onClose }) => {
  const [departmentId, setDepartmentId] = useState("")
  const [departmentName, setDepartmentName] = useState("")
  const [observation, setObservation] = useState("")
  const [documentName, setDocumentName] = useState("")
  const [selectedType, setSelectedType] = useState("1")
  const [departments, setDepartments] = useState<any[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [documentContent, setDocumentContent] = useState("")

  const handleSearchDepartment = async (query: string) => {
    setSearchQuery(query)
    try {
      const response = await fetch(
        "https://webseiapi.jaru.ro.gov.br/listar_unidades",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            SiglaSistema: "APIWSSEI",
            IdentificacaoServico: "consultarSEIJARU",
            IdTipoProcedimento: "",
            IdSerie: "",
            query,
            page: 1,
            per_page: 10
          })
        }
      )
      const data = await response.json()
      if (data && data.unidades) {
        setDepartments(data.unidades)
      }
    } catch (error) {
      console.error("Erro ao buscar departamento:", error)
    }
  }

  const handleSelectDepartment = (id: string, name: string) => {
    setDepartmentId(id)
    setDepartmentName(name)
    setDepartments([])
    setSearchQuery(name)
  }

  const fetchDocumentContent = async () => {
    try {
      const response = await fetch(
        "https://integracaoseipublica.jaru.ro.gov.br/api/ver_doc_capturado",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            cpf_user: "04870016214",
            cd_docto: 2498640,
            vr_docto: "1",
            only_body: "S"
          })
        }
      )
      const data = await response.json()
      console.log("CD Documento:", cdDocto) // Mensagem em português
      console.log("Conteúdo do Documento:", data.result[0].conteudoDocto || "") // Mensagem em português
      if (data.result && data.result.length > 0) {
        setDocumentContent(data.result[0].conteudoDocto || "")
      }
    } catch (error) {
      console.error("Erro ao buscar o conteúdo do documento:", error)
    }
  }

  const handleSubmit = async () => {
    await fetchDocumentContent()

    try {
      const response = await fetch(
        "https://webseiapi.jaru.ro.gov.br/incluir_documento",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            SiglaSistema: "APIWSSEI",
            IdentificacaoServico: "consultarSEIJARU",
            IdUnidade: departmentId,
            Tipo: "G",
            IdProcedimento: "12",
            IdSerie: "622",
            Numero: "0.000000010/2024-2.",
            Interessados: [
              {
                Sigla: "DTI",
                Nome: ""
              }
            ],
            Observacao: "",
            NomeArquivo: "",
            Conteudo: documentContent, // Usar o conteúdo do documento aqui
            NivelAcesso: "1"
          })
        }
      )

      if (!response.ok) {
        throw new Error("Falha ao enviar o documento")
      }

      const result = await response.json()
      console.log("Documento enviado com sucesso:", result) // Mensagem em português
      onClose()
    } catch (error) {
      console.error("Erro ao enviar o documento:", error)
    }
  }

  return (
    <div style={modalOverlayStyle}>
      <div style={modalContentStyle}>
        <p>{message}</p>
        <input
          type="text"
          placeholder="Buscar Departamento"
          value={searchQuery}
          onChange={(e) => handleSearchDepartment(e.target.value)}
          style={inputStyle}
        />
        {departments.length > 0 && (
          <ul style={departmentListStyle}>
            {departments.map((department) => (
              <li
                key={department.IdUnidade.IdUnidade}
                onClick={() =>
                  handleSelectDepartment(
                    department.IdUnidade.IdUnidade,
                    department.Descricao.Descricao
                  )
                }
                style={departmentItemStyle}>
                {department.Descricao.Descricao}
              </li>
            ))}
          </ul>
        )}
        <input
          type="text"
          placeholder="Observação"
          value={observation}
          onChange={(e) => setObservation(e.target.value)}
          style={inputStyle}
        />
        <input
          type="text"
          placeholder="Nome do Documento"
          value={documentName}
          onChange={(e) => setDocumentName(e.target.value)}
          style={inputStyle}
        />
        <select
          value={selectedType}
          onChange={(e) => setSelectedType(e.target.value)}
          style={inputStyle}>
          <option value="1">Restrito</option>
          <option value="2">Sigiloso</option>
        </select>
        <button onClick={handleSubmit} style={buttonStyle}>
          Enviar
        </button>
        <button onClick={onClose} style={buttonStyle}>
          Fechar
        </button>
      </div>
    </div>
  )
}

const modalOverlayStyle: React.CSSProperties = {
  position: "fixed",
  top: 0,
  left: 0,
  width: "100%",
  height: "100%",
  backgroundColor: "rgba(0, 0, 0, 0.5)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center"
}

const modalContentStyle: React.CSSProperties = {
  backgroundColor: "white",
  padding: "20px",
  borderRadius: "8px",
  width: "400px",
  boxShadow: "0 2px 10px rgba(0, 0, 0, 0.1)"
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px",
  margin: "10px 0",
  border: "1px solid #ddd",
  borderRadius: "4px"
}

const departmentListStyle: React.CSSProperties = {
  listStyleType: "none",
  padding: 0
}

const departmentItemStyle: React.CSSProperties = {
  padding: "10px",
  cursor: "pointer",
  borderBottom: "1px solid #ddd"
}

const buttonStyle: React.CSSProperties = {
  padding: "10px 20px",
  margin: "10px",
  border: "none",
  borderRadius: "4px",
  backgroundColor: "#007bff",
  color: "white",
  cursor: "pointer"
}

export default Modal
