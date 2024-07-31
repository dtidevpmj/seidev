import type { PlasmoCSConfig } from "plasmo"
import React, { useState, type FC } from "react"

import IntegracaoList from "./IntegracaoList"

export const config: PlasmoCSConfig = {
  matches: ["https://sei-docs-implementacao.jaru.ro.gov.br/sei/*"],
  all_frames: true
}

// Variável global
let globalCdTipoDocto = ""
let globalcdInteressado = " "

interface ModalComponentProps {
  iframeDocument: Document
  cpf: string | null
}

interface Integracao {
  integracaoAno: number
  integracaoCapturado: string
  integracaoNumero: string
  integracaoDescricao: string
}

const ModalComponent: FC<ModalComponentProps> = ({ iframeDocument, cpf }) => {
  const [unidGestora, setUnidGestora] = useState("")
  const [tipoDocto, setTipoDocto] = useState("")
  const [dataRef, setDataRef] = useState("")
  const [repeatProcess, setRepeatProcess] = useState(false)
  const [searchTermUnid, setSearchTermUnid] = useState("")
  const [searchResultsUnid, setSearchResultsUnid] = useState<any[]>([])
  const [searchTermDoc, setSearchTermDoc] = useState("")
  const [searchResultsDoc, setSearchResultsDoc] = useState<any[]>([])
  const [loadingUnid, setLoadingUnid] = useState(false)
  const [loadingDoc, setLoadingDoc] = useState(false)
  const [errorUnid, setErrorUnid] = useState<string | null>(null)
  const [errorDoc, setErrorDoc] = useState<string | null>(null)
  const [submitStatus, setSubmitStatus] = useState<string | null>(null)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [integracoes, setIntegracoes] = useState<Integracao[]>([])
  const [showIntegracaoList, setShowIntegracaoList] = useState(false)
  const [cdInteressado, setCdInteressado] = useState<number | null>(null)

  const closeModal = () => {
    const modal = iframeDocument.querySelector("#customModal")
    if (modal) {
      modal.remove()
    }
  }

  const handleSearchUnid = async (term: string) => {
    if (!term || !cpf) {
      setErrorUnid("CPF e descrição são obrigatórios.")
      return
    }
    setLoadingUnid(true)
    setErrorUnid(null)
    try {
      const response = await fetch(
        "https://integracaoseipublica.jaru.ro.gov.br/api/unid_gestoras_list",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ cpf: cpf, descricao: term })
        }
      )
      if (!response.ok) {
        throw new Error(`Erro na API: ${response.statusText}`)
      }
      const result = await response.json()
      setSearchResultsUnid(result.result[0].unidGestorasWs)
    } catch (error) {
      setErrorUnid("Erro ao buscar unidades. Tente novamente.")
      console.error("Erro ao buscar unidades:", error)
    } finally {
      setLoadingUnid(false)
    }
  }

  const handleSearchDoc = async (term: string) => {
    if (!term || !cpf) {
      setErrorDoc("CPF e descrição são obrigatórios.")
      return
    }
    setLoadingDoc(true)
    setErrorDoc(null)
    try {
      const response = await fetch(
        "https://integracaoseipublica.jaru.ro.gov.br/api/doctos_tipos_list",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ cpf: cpf, descricao: term })
        }
      )
      if (!response.ok) {
        throw new Error(`Erro na API: ${response.statusText}`)
      }
      const result = await response.json()
      setSearchResultsDoc(result.result[0].doctoTiposWs)
    } catch (error) {
      setErrorDoc("Erro ao buscar tipos de documentos. Tente novamente.")
      console.error("Erro ao buscar tipos de documentos:", error)
    } finally {
      setLoadingDoc(false)
    }
  }

  const handleSelectUnid = (cdUnidGestora: string, dcUnidGestora: string) => {
    setUnidGestora(cdUnidGestora)
    setSearchTermUnid(dcUnidGestora)
    setSearchResultsUnid([])
  }

  const handleSelectDoc = (cdTipoDocto: string, dcTipoDocto: string) => {
    setTipoDocto(cdTipoDocto)
    setSearchTermDoc(dcTipoDocto)
    setSearchResultsDoc([])
  }

  const formatDate = (dateString: string): string => {
    const [year, month, day] = dateString.split("-")
    return `${day}/${month}/${year}`
  }

  const handleSubmit = async () => {
    if (!cpf || !unidGestora || !tipoDocto || !dataRef) {
      setSubmitError("Todos os campos são obrigatórios.")
      return
    }
    const formattedDate = formatDate(dataRef)
    const tipoDoctoNumber = Number(tipoDocto)
    if (isNaN(tipoDoctoNumber)) {
      setSubmitError("Tipo de Documento deve ser um número válido.")
      return
    }
    const data = {
      cpf_user: cpf,
      cd_unid_gestora: unidGestora,
      cd_tipo_docto: tipoDoctoNumber,
      cd_tipo_integracao: "1",
      data_ref: formattedDate
    }
    setSubmitStatus(null)
    setSubmitError(null)
    try {
      const response = await fetch(
        "https://integracaoseipublica.jaru.ro.gov.br/api/integracao_scpi_list",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data)
        }
      )
      if (!response.ok) {
        throw new Error(`Erro na API: ${response.statusText}`)
      }
      const result = await response.json()
      setCdInteressado(result.result[0].cdInteressado)
      setIntegracoes(result.result[0].dadosIntegracoes)
      setSubmitStatus("Dados enviados com sucesso!")
      setShowIntegracaoList(true)
      globalCdTipoDocto = tipoDocto
      console.log(tipoDocto)
      globalcdInteressado = String(result.result[0].cdInteressado)
      console.log("Dados enviados com sucesso:", result)
    } catch (error) {
      setSubmitError("Erro ao enviar dados. Tente novamente.")
      console.error("Erro ao enviar dados:", error)
    }
  }

  const modalStyle = {
    position: "fixed" as "fixed",
    top: "54%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    width: "97%",
    height: "88%",
    backgroundColor: "white",
    zIndex: 1000,
    borderRadius: "8px"
  } as React.CSSProperties

  const contentStyle = {
    padding: "20px",
    position: "relative" as "relative",
    fontFamily: "Arial, sans-serif",
    height: "100%",
    overflow: "auto"
  } as React.CSSProperties

  const closeButtonStyle = {
    position: "absolute" as "absolute",
    top: "10px",
    right: "10px",
    padding: "5px 10px",
    backgroundColor: "transparent",
    border: "none",
    cursor: "pointer",
    fontSize: "16px"
  } as React.CSSProperties

  const titleStyle = {
    marginBottom: "20px",
    fontSize: "24px",
    color: "#333"
  } as React.CSSProperties

  const labelStyle = {
    display: "block",
    marginTop: "10px",
    fontSize: "14px",
    color: "#666"
  } as React.CSSProperties

  const inputStyle = {
    width: "calc(100% - 20px)",
    marginTop: "5px",
    padding: "10px",
    fontSize: "14px",
    border: "1px solid #ccc",
    borderRadius: "4px",
    boxSizing: "border-box"
  } as React.CSSProperties

  const checkboxContainerStyle = {
    marginTop: "15px"
  } as React.CSSProperties

  const submitButtonStyle = {
    marginTop: "20px",
    padding: "10px 20px",
    backgroundColor: "#007bff",
    color: "white",
    border: "none",
    cursor: "pointer",
    borderRadius: "4px"
  } as React.CSSProperties

  const suggestionsStyle = {
    listStyleType: "none",
    padding: 0,
    margin: "5px 0",
    maxHeight: "100px",
    overflowY: "auto",
    border: "1px solid #ccc",
    borderRadius: "4px",
    backgroundColor: "white",
    boxShadow: "0px 4px 8px rgba(0, 0, 0, 0.1)"
  } as React.CSSProperties

  const suggestionItemStyle = {
    padding: "10px",
    cursor: "pointer"
  } as React.CSSProperties

  const handleInputChangeUnid = (e: React.ChangeEvent<HTMLInputElement>) => {
    const term = e.target.value
    setSearchTermUnid(term)
    handleSearchUnid(term)
  }

  const handleInputChangeDoc = (e: React.ChangeEvent<HTMLInputElement>) => {
    const term = e.target.value
    setSearchTermDoc(term)
    handleSearchDoc(term)
  }

  return (
    <div style={modalStyle}>
      {showIntegracaoList ? (
        <IntegracaoList
          integracoes={integracoes}
          cd_tipo_docto={Number(globalCdTipoDocto)}
          cdInteressado={Number(globalcdInteressado)}
        />
      ) : (
        <div style={contentStyle}>
          <button onClick={closeModal} style={closeButtonStyle}>
            &times;
          </button>
          <h2 style={titleStyle}>Listar Documentos para ser Capturados</h2>
          <label style={labelStyle}>Unidade Gestora</label>
          <input
            type="text"
            placeholder="Pesquisar Unidade"
            style={inputStyle}
            value={searchTermUnid}
            onChange={(e) => {
              setSearchTermUnid(e.target.value)
              handleSearchUnid(e.target.value)
            }}
          />
          {loadingUnid && <p>Carregando...</p>}
          {errorUnid && <p style={{ color: "red" }}>{errorUnid}</p>}
          {!loadingUnid && !errorUnid && searchResultsUnid.length > 0 && (
            <ul style={suggestionsStyle}>
              {searchResultsUnid.map((item) => (
                <li
                  key={item.cdUnidGestora}
                  onClick={() =>
                    handleSelectUnid(item.cdUnidGestora, item.dcUnidGestora)
                  }
                  style={suggestionItemStyle}>
                  {item.dcUnidGestora}
                </li>
              ))}
            </ul>
          )}
          <label style={labelStyle}>Tipo de Documento</label>
          <input
            type="text"
            placeholder="Pesquisar Tipo de Documento"
            style={inputStyle}
            value={searchTermDoc}
            onChange={(e) => {
              setSearchTermDoc(e.target.value)
              handleSearchDoc(e.target.value)
            }}
          />
          {loadingDoc && <p>Carregando...</p>}
          {errorDoc && <p style={{ color: "red" }}>{errorDoc}</p>}
          {!loadingDoc && !errorDoc && searchResultsDoc.length > 0 && (
            <ul style={suggestionsStyle}>
              {searchResultsDoc.map((item) => (
                <li
                  key={item.cdTipoDocto}
                  onClick={() =>
                    handleSelectDoc(item.cdTipoDocto, item.dcTipoDocto)
                  }
                  style={suggestionItemStyle}>
                  {item.dcTipoDocto}
                </li>
              ))}
            </ul>
          )}
          <label style={labelStyle}>Data de Referência</label>
          <input
            type="date"
            style={inputStyle}
            value={dataRef}
            onChange={(e) => setDataRef(e.target.value)}
          />
          <div style={checkboxContainerStyle}>
            <input
              type="checkbox"
              checked={repeatProcess}
              onChange={(e) => setRepeatProcess(e.target.checked)}
            />
            <label
              style={{ marginLeft: "10px", fontSize: "14px", color: "#666" }}>
              Mesmo Processo?
            </label>
          </div>
          {submitStatus && <p style={{ color: "green" }}>{submitStatus}</p>}
          {submitError && <p style={{ color: "red" }}>{submitError}</p>}
          <button onClick={handleSubmit} style={submitButtonStyle}>
            Enviar
          </button>
        </div>
      )}
    </div>
  )
}

export default ModalComponent
