import type { PlasmoCSConfig } from "plasmo"
import React, { useEffect, useState, type FC } from "react"

import Modal from "./DocumentModal"

export const config: PlasmoCSConfig = {
  matches: ["https://sei-docs-implementacao.jaru.ro.gov.br/sei/*"],
  all_frames: true
}

interface Integracao {
  [x: string]: any
  integracaoAno: number
  integracaoCapturado: string
  integracaoNumero: string
  integracaoDescricao: string
  integracaoChave: string
  integracaoData: number
  integracaoValor: number
  integracaoUG: number
  integracaoOrgao: number
  integracaoSequencia: number
  cnpjOrCpfInteressado: string
  nmInteressado: string
  integracaoVencto: number
}

interface IntegracaoListProps {
  integracoes: Integracao[]
  cd_tipo_docto: number
  cdInteressado: number
}

const IntegracaoList: FC<IntegracaoListProps> = ({
  integracoes,
  cd_tipo_docto,
  cdInteressado
}) => {
  const [modalMessage, setModalMessage] = useState<string | null>(null)
  const [selectedIndices, setSelectedIndices] = useState<number[]>([])
  const [selectAll, setSelectAll] = useState(false)
  const [userCpf, setUserCpf] = useState<string>("")
  const [cdDocto, setCdDocto] = useState<number | null>(null)

  useEffect(() => {
    const userElement = document.querySelector(
      "#lnkUsuarioSistema"
    ) as HTMLElement
    if (userElement) {
      const userTitle = userElement.title
      const userName = userTitle.match(/\(([^)]+)\)/)?.[1].split("/")[0]

      if (userName) {
        const url = `https://api-usr-controller.jaru.ro.gov.br/user/cpf/${userName}`
        fetch(url)
          .then((response) => response.text())
          .then((data) => {
            setUserCpf(data.trim())
          })
          .catch((error) => {
            console.error("Erro ao fazer a requisição à API:", error)
          })
      } else {
        console.error("Nome do usuário não encontrado")
      }
    } else {
      console.error("Elemento do usuário não encontrado")
    }
  }, [])

  const handleCheckboxChange = (index: number) => {
    setSelectedIndices((prevIndices) =>
      prevIndices.includes(index)
        ? prevIndices.filter((i) => i !== index)
        : [...prevIndices, index]
    )
  }

  const handleSelectAllChange = () => {
    setSelectAll((prev) => {
      const newSelectAll = !prev
      setSelectedIndices(
        newSelectAll ? integracoes.map((_, index) => index) : []
      )
      return newSelectAll
    })
  }

  const handleSendClick = () => {
    if (selectedIndices.length > 0) {
      const selectedItems = selectedIndices.map((index) => integracoes[index])

      Promise.all(
        selectedItems.map((item) => {
          const payload = {
            type: "uDTMBrowser.TRecDoctoWs",
            id: 1,
            fields: {
              FCdDocto: 0,
              FVrDocto: 0,
              FAcaoWs: "Insert",
              FTokenWs: "",
              FCdTipoDocto: cd_tipo_docto,
              FDcTipoDocto: null,
              FIdentificacaoDocto: null,
              FDataDocto: item.integracaoData,
              FCdUnidadeDocto: null,
              FDcUnidadeDocto: null,
              FSgUnidadeDocto: null,
              FCdUnidadeProcessoDocto: null,
              FDcUnidadeProcessoDocto: null,
              FSgUnidadeProcessoDocto: null,
              FCdUGDocto: null,
              FDcUGDocto: null,
              FCdOrgaoDocto: null,
              FDcOrgaoDocto: null,
              FSgOrgaoDocto: null,
              FCdInteressadoDocto: cdInteressado,
              FNmInteressadoDocto: item.nmInteressado,
              FCpfCnpjInteressadoDocto: userCpf,
              FCdAssuntoDocto: null,
              FDcAssuntoDocto: null,
              FSumulaDocto: "",
              FPkProcessoDocto: null,
              FProcessoIdDocto: null,
              FExternoDocto: "N",
              FDigitalizadoDocto: "N",
              FIntegracaoDocto: "S",
              FDadosIntegracaoWs: {
                type: "uDTMBrowser.TRecDadosIntegracaoWs",
                id: 2,
                fields: {
                  FIntegracaoTipo: 1,
                  FIntegracaoChave: item.integracaoChave,
                  FIntegracaoNumero: item.integracaoNumero,
                  FIntegracaoAno: item.integracaoAno,
                  FIntegracaoSequencia: item.integracaoSequencia,
                  FIntegracaoData: item.integracaoData,
                  FIntegracaoVencto: item.integracaoVencto,
                  FIntegracaoValor: item.integracaoValor,
                  FIntegracaoDescricao: item.integracaoDescricao,
                  FIntegracaoUG: item.integracaoUG,
                  FIntegracaoOrgao: 1,
                  FIntegracaoFpEmpresa: null,
                  FIntegracaoFpUnidade: null,
                  FIntegracaoFpTipoRef: null,
                  FIntegracaoTbEmpresa: null,
                  FIntegracaoTbModulo: null,
                  FIntegracaoTbCadastro: null
                }
              },
              FFinalizadoDocto: "N",
              FCanceladoDocto: "N",
              FAssinadoDocto: "N",
              FRestritoDocto: "N",
              FCdTipoRestritoDocto: 0,
              FDcTipoRestritoDocto: "",
              FCdUsuarioDocto: "1",
              FNmUsuarioDocto: "EQUIPE DE SUPORTE",
              FPortalDocto: "S",
              FCdModeloDocto: 3,
              FDcModeloDocto: null,
              FVrModeloDocto: 1,
              FApocrifoDocto: "N",
              FCRC32Docto: null,
              FPrazoDocto: 0,
              FConteudoDocto: "",
              FTipoDocto: "HTML",
              FDoctoSignsWs: null,
              FDoctoAwaresWs: null
            }
          }

          return fetch(
            "https://integracaoseipublica.jaru.ro.gov.br/api/docto_view",
            {
              method: "PUT",
              headers: {
                "Content-Type": "application/json"
              },
              body: JSON.stringify(payload)
            }
          ).then((response) => response.json())
        })
      )
        .then((responses) => {
          console.log("Responses:", responses)
          const cdDoctoFromResponse = responses[0]?.result?.[0]?.cdDocto
          if (cdDoctoFromResponse) {
            setCdDocto(cdDoctoFromResponse)
          }
          setModalMessage("Dados enviados com sucesso!")
        })
        .catch((error) => {
          console.error("Error:", error)
          setModalMessage("Erro ao enviar os dados.")
        })
    } else {
      setModalMessage("Nenhum item selecionado")
    }
  }

  const handleCloseModal = () => {
    setModalMessage(null)
  }

  return (
    <div style={containerStyle}>
      {modalMessage && (
        <Modal onClose={handleCloseModal} message={""} cdDocto={cdDocto} />
      )}
      <div style={selectAllContainerStyle}>
        <input
          type="checkbox"
          checked={selectAll}
          onChange={handleSelectAllChange}
          style={checkboxStyle}
        />
        <label style={selectAllLabelStyle}>Selecionar Todos</label>
      </div>
      <div style={listContainerStyle}>
        {integracoes.map((integracao, index) => (
          <div key={index} style={listItemStyle}>
            <input
              type="checkbox"
              style={checkboxStyle}
              checked={selectedIndices.includes(index)}
              onChange={() => handleCheckboxChange(index)}
            />
            <div style={infoStyle}>
              <div style={topRowStyle}>
                <div style={capturadoStyle}>
                  Capturado: {integracao.integracaoCapturado}
                </div>
                <div style={anoStyle}>Ano: {integracao.integracaoAno}</div>
                <div style={numeroStyle}>ID: {integracao.integracaoNumero}</div>
              </div>
              <div style={descricaoStyle}>{integracao.integracaoDescricao}</div>
            </div>
          </div>
        ))}
      </div>
      <button style={sendButtonStyle} onClick={handleSendClick}>
        Enviar
      </button>
    </div>
  )
}

const containerStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  marginTop: "20px"
}

const selectAllContainerStyle: React.CSSProperties = {
  padding: "0 25px",
  marginBottom: "5px"
}

const selectAllLabelStyle: React.CSSProperties = {
  marginLeft: "10px",
  fontSize: "14px",
  color: "#666"
}

const listContainerStyle: React.CSSProperties = {
  padding: "20px",
  maxHeight: "470px",
  overflowY: "auto",
  flex: 1,
  marginBottom: "20px"
}

const listItemStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "flex-start",
  padding: "15px",
  borderTop: "1px solid rgb(0, 123, 255)",
  borderRadius: "4px",
  marginBottom: "10px",
  boxShadow: "0 2px 1px rgba(0, 0, 0, 0.1)"
}

const checkboxStyle: React.CSSProperties = {
  marginRight: "10px",
  marginTop: "5px"
}

const infoStyle: React.CSSProperties = {
  flex: 1
}

const topRowStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: "5px"
}

const capturadoStyle: React.CSSProperties = {
  flex: 1,
  textAlign: "left"
}

const anoStyle: React.CSSProperties = {
  flex: 1,
  textAlign: "center"
}

const numeroStyle: React.CSSProperties = {
  flex: 1,
  textAlign: "right"
}

const descricaoStyle: React.CSSProperties = {
  marginTop: "5px",
  fontSize: "14px",
  color: "#666"
}

const sendButtonStyle: React.CSSProperties = {
  padding: "10px 20px",
  fontSize: "16px",
  fontWeight: "600",
  color: "#fff",
  backgroundColor: "#007bff",
  border: "none",
  borderRadius: "4px",
  cursor: "pointer",
  marginTop: "10px",
  display: "flex",
  width: "100px",
  margin: "0 auto",
  alignItems: "center",
  justifyContent: "center",
  transition: "background-color 0.3s ease"
}

export default IntegracaoList
