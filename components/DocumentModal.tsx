import React, { useEffect, useState, type FC } from "react"

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
  const [documentContent, setDocumentContent] = useState("")
  const [idProcedimento, setIdProcedimento] = useState<string | null>(null)
  const [userCpf, setUserCpf] = useState<string>("")
  const [showIncluirDocumentoModal, setShowIncluirDocumentoModal] =
    useState(false)
  const [blockId, setBlockId] = useState("")
  const [annotation, setAnnotation] = useState("")

  useEffect(() => {
    const fetchUserCpf = async () => {
      const userElement = document.querySelector(
        "#lnkUsuarioSistema"
      ) as HTMLElement

      if (userElement) {
        const userTitle = userElement.title
        const userName = userTitle.match(/\(([^)]+)\)/)?.[1].split("/")[0]

        if (userName) {
          try {
            const response = await fetch(
              `https://api-usr-controller.jaru.ro.gov.br/user/cpf/${userName}`
            )
            const data = await response.text()
            setUserCpf(data.trim())
          } catch (error) {
            console.error("Erro ao fazer a requisição à API:", error)
          }
        } else {
          console.error("Nome do usuário não encontrado no título.")
        }
      } else {
        console.error("Elemento do usuário não encontrado")
      }
    }

    fetchUserCpf()
  }, [])

  useEffect(() => {
    const fetchDocumentContent = async () => {
      if (cdDocto === null || !userCpf) {
        return
      }

      try {
        const response = await fetch(
          "https://integracaoseipublica.jaru.ro.gov.br/api/ver_doc_capturado",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              cpf_user: userCpf,
              cd_docto: cdDocto,
              vr_docto: "1",
              only_body: "S"
            })
          }
        )
        const data = await response.json()
        if (
          data.result &&
          Array.isArray(data.result) &&
          data.result.length > 0
        ) {
          let conteudoDocto = data.result[0]?.conteudoDocto
          if (conteudoDocto) {
            conteudoDocto = removeUnwantedContent(conteudoDocto)
          }
          setDocumentContent(conteudoDocto || "")
        } else {
          console.error("Documento não encontrado ou conteúdo vazio")
          setDocumentContent("")
        }
      } catch (error) {
        console.error("Erro ao buscar o conteúdo do documento:", error)
        setDocumentContent("")
      }
    }

    fetchDocumentContent()
  }, [cdDocto, userCpf])

  const removeUnwantedContent = (content: string): string => {
    const regex =
      /<div style="text-align:center"><span style="font-size:14px"><strong>PREFEITURA MUNICIPAL DE JARU - RO<\/strong><\/span><\/div>/g
    return content.replace(regex, "")
  }

  useEffect(() => {
    const fetchDepartment = async (query: string) => {
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
        if (data && data.unidades && data.unidades.length > 0) {
          const department = data.unidades[0]
          setDepartmentId(department.IdUnidade.IdUnidade)
          setDepartmentName(department.Descricao.Descricao)
        } else {
          console.error("Nenhum departamento encontrado")
        }
      } catch (error) {
        console.error("Erro ao buscar departamento:", error)
      }
    }

    const departamentElement = document.querySelector(
      "#lnkInfraUnidade"
    ) as HTMLElement
    if (departamentElement) {
      const departamentTitle = departamentElement.title
      console.log("Título do departamento:", departamentTitle)
      fetchDepartment(departamentTitle)
    } else {
      console.log("Elemento não encontrado.")
    }
  }, [])

  useEffect(() => {
    const extractIdProcedimento = () => {
      const iframe = document.querySelector("#ifrArvore") as HTMLIFrameElement
      if (iframe) {
        const url = new URL(iframe.src)
        const idProcedimento = url.searchParams.get("id_procedimento")
        setIdProcedimento(idProcedimento)
        console.log("ID do Procedimento:", idProcedimento)
      }
    }

    extractIdProcedimento()
  }, [])

  const handleSubmit = async () => {
    if (cdDocto === null) {
      console.error("CD Documento não fornecido")
      return
    }

    try {
      const numeroProcessoElement = document.querySelector(
        "#divInfraBarraLocalizacao"
      ) as HTMLElement

      let numeroProcesso = numeroProcessoElement?.textContent?.trim()

      if (numeroProcesso && numeroProcesso.endsWith(".")) {
        numeroProcesso = numeroProcesso.slice(0, -1)
      }

      console.log("Número do Processo:", numeroProcesso)

      if (!numeroProcesso) {
        console.error("Número do Processo não encontrado")
        return
      }

      if (!idProcedimento) {
        console.error("ID do Procedimento não encontrado")
        return
      }

      const requestPayload = {
        SiglaSistema: "APIWSSEI",
        IdentificacaoServico: "consultarSEIJARU",
        IdUnidade: departmentId,
        Tipo: "G",
        IdProcedimento: idProcedimento,
        IdSerie: "622",
        Numero: numeroProcesso,
        Observacao: observation,
        NomeArquivo: documentName,
        Conteudo: documentContent,
        NivelAcesso: selectedType
      }

      console.log(
        "Dados enviados para a rota incluir_documento:",
        requestPayload
      )

      const response = await fetch(
        "https://webseiapi.jaru.ro.gov.br/incluir_documento",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(requestPayload)
        }
      )

      if (!response.ok) {
        throw new Error("Falha ao enviar o documento")
      }

      const result = await response.json()
      console.log("Documento enviado com sucesso:", result)
      setShowIncluirDocumentoModal(true)
    } catch (error) {
      console.error("Erro ao enviar o documento:", error)
    }
  }

  const handleFinalizarClick = () => {
    console.log("ID do Bloco:", blockId)
    console.log("Anotação:", annotation)
    setShowIncluirDocumentoModal(false)
    onClose()
    window.location.reload() // Atualiza a página
  }

  return (
    <>
      <div style={modalOverlayStyle}>
        <div style={modalContentStyle}>
          <div style={modalHeaderStyle}>
            <h2 style={{ fontSize: "20px" }}>INCLUIR DOCUMENTO</h2>
            <button onClick={onClose} style={closeButtonStyle}>
              X
            </button>
          </div>
          <input
            type="text"
            placeholder="Departamento"
            value={departmentName}
            readOnly
            style={inputStyle}
          />
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
          <button onClick={handleSubmit} style={submitButtonStyle}>
            Enviar
          </button>
        </div>
      </div>
      {showIncluirDocumentoModal && (
        <div style={modalOverlayStyle}>
          <div style={modalContentStyle}>
            <div style={modalHeaderStyle}>
              <h2 style={{ fontSize: "20px" }}>INCLUIR DOCUMENTO</h2>
              <button onClick={handleFinalizarClick} style={closeButtonStyle}>
                X
              </button>
            </div>
            <input
              type="text"
              placeholder="Digite o ID do bloco"
              value={blockId}
              onChange={(e) => setBlockId(e.target.value)}
              style={inputStyle}
            />
            <input
              type="text"
              placeholder="Digite uma anotação"
              value={annotation}
              onChange={(e) => setAnnotation(e.target.value)}
              style={inputStyle}
            />
            <button onClick={handleFinalizarClick} style={submitButtonStyle}>
              Finalizar
            </button>
          </div>
        </div>
      )}
    </>
  )
}

const modalOverlayStyle: React.CSSProperties = {
  position: "fixed",
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: "rgba(0,0,0,0.5)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center"
}

const modalContentStyle: React.CSSProperties = {
  backgroundColor: "white",
  borderRadius: "8px",
  padding: "20px",
  width: "400px",
  maxWidth: "90%",
  boxShadow: "0 0 10px rgba(0,0,0,0.1)",
  position: "relative"
}

const modalHeaderStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: "20px"
}

const closeButtonStyle: React.CSSProperties = {
  background: "none",
  border: "none",
  fontSize: "24px",
  cursor: "pointer",
  color: "#333"
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px",
  marginBottom: "10px",
  border: "1px solid #ccc",
  borderRadius: "4px"
}

const submitButtonStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px",
  backgroundColor: "#007bff",
  color: "white",
  border: "none",
  borderRadius: "4px",
  cursor: "pointer",
  fontSize: "16px"
}

export default Modal
