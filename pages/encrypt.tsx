import {NextPage} from "next";
import React, {useState} from "react";
import {
  Alert,
  Button, Card, CardActions, CardContent,
  Collapse,
  Container,
  Fade, List,
  Paper,
  Stack,
  Step,
  StepLabel,
  Stepper,
  TextField,
  Typography
} from "@mui/material";
import Box from "@mui/material/Box";
import {TransitionGroup} from "react-transition-group";
import {LoadingButton} from "@mui/lab";
import base64url from 'base64url';
import {string} from "prop-types";

interface Props {
  status: number,
  setStatus: (enable: number) => void
}

let pubKey: CryptoKey
const Step1 = (props: Props) => {
  const [confirm, setConfirm] = useState(true)
  const loadHandler = (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log(e.target.files)
    if (e.target.files != null) {
      let keyFile = e.target.files[0]
      const reader = new FileReader()
      reader.onload = () => {
        const keyObj = JSON.parse(reader.result as string)
        console.log(keyObj)
        window.crypto.subtle.importKey(
          "jwk",
          {
            kty: "RSA",
            e: "AQAB",
            n: keyObj.n,
            alg: "RSA-OAEP-256",
            ext: true,
          },
          {
            name: "RSA-OAEP",
            hash: {name: "SHA-256"},
          },
          false,
          ["encrypt"]
        )
          .then(function (publicKey) {
            pubKey = publicKey
            setConfirm(false)
          })
          .catch(function (err) {
            console.error(err);
          });

      }
      reader.readAsText(keyFile)
    }
  }
  return (
    <Fade in={props.status == 0} style={{transitionDelay: `400ms`}} unmountOnExit>
      <Paper sx={{my: 5, p: 2}} elevation={12}>
        <p>暗号化キー読み込み</p>
        <Box
          component="form"
          noValidate
          autoComplete="off"
        >
          <Alert severity="info" sx={{my: 2}}>
            ファイル受信者から受け取った暗号化キーを読み込んでください。暗号化キーは送信者が生成するのではなく受信者が生成してください。

          </Alert>
          <Button
            component="label"
            variant="contained"
          >
            読み込み
            <input
              type="file"
              style={{
                opacity: 0,
                position: 'absolute'
              }}
              accept=".NPPAPKEY"
              onChange={loadHandler}
            />
          </Button>

          <div style={{
            textAlign: "right"
          }}>
            <Button
              variant="contained"
              onClick={() => {
                props.setStatus(props.status + 1)
              }}
              disabled={confirm}
            >次へ</Button>
          </div>
        </Box>
      </Paper>
    </Fade>
  )
}

interface Ifile {
  raw: ArrayBuffer,
  encrypted: string,
  status: boolean
  name: string
}
const download = (file:Ifile) => {
  const fileName = file.name+".encrypted";
  const data = new Blob([file.encrypted], { type: 'text/json' });
  const jsonURL = window.URL.createObjectURL(data);
  const link = document.createElement('a');
  document.body.appendChild(link);
  link.href = jsonURL;
  link.setAttribute('download', fileName);
  link.click();
  document.body.removeChild(link);
}
function string_to_buffer(src:string):ArrayBuffer {
  // @ts-ignore
  return (new Uint16Array([].map.call(src, function(c) {
    // @ts-ignore
    return c.charCodeAt(0)
  }))).buffer;
}
function buffer_to_base64(buf:ArrayBuffer):string {
  // @ts-ignore
  return base64url.encode(buf, 'utf8')
}


const encryptkey = (key: CryptoKey):Promise<string> => {
  return new Promise<string>((res,rej) => {
    window.crypto.subtle.exportKey(
      "jwk", //can be "jwk" or "raw"
      key //extractable must be true
    )
      .then(function(keydata){
        console.log(keydata)
        window.crypto.subtle.encrypt(
          {
            name: "RSA-OAEP",
          },
          pubKey,
          string_to_buffer(JSON.stringify(keydata))
        )
          .then(function(encrypted){
            res(buffer_to_base64(encrypted))
          })
          .catch(function(err){
            console.error(err);
          });
      })
      .catch(function(err){
        console.error(err);
      });
  })
}
function encryptData(data: ArrayBuffer, aesKey: CryptoKey):Promise<string> {
  return new Promise<string>((res,rej) => {
    window.crypto.subtle.encrypt(
      {
        name: "AES-CBC",
        //Don't re-use initialization vectors!
        //Always generate a new iv every time your encrypt!
        iv: window.crypto.getRandomValues(new Uint8Array(16)),
      },
      aesKey, //from generateKey or importKey above
      data //ArrayBuffer of data you want to encrypt
    )
      .then(function(encrypted){
        //returns an ArrayBuffer containing the encrypted data
        res(buffer_to_base64(encrypted));
      })
      .catch(function(err){
        console.error(err);
      });
  })


}
const Step2 = (props: Props) => {
  const [fileCards, setFilecards] = useState<Ifile[]>([])
  const loadHandler = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files != null) {
      const target = e.target.files[0]
      const reader = new FileReader()
      reader.onload = async () => {
        const data = reader.result as ArrayBuffer
        console.log(data)
        const current: Ifile = {
          raw: data,
          encrypted: "",
          status: false,
          name: target.name
        }
        const idx = fileCards.length

        setFilecards([...fileCards, current])

        //AES暗号用パスワード生成（ファイルごとに生成する
        const aesKey = await window.crypto.subtle.generateKey(
          {
            name: "AES-CBC",
            length: 256,
          },
          true,
          ["encrypt", "decrypt"]
        )

        //AES暗号用パスワードをRSAで暗号化する
        const base64EncryptedPW = await encryptkey(aesKey)
        //元データをAESで暗号化する

        const encryptedData = await encryptData(current.raw,aesKey)

        const result = JSON.stringify({
          data: encryptedData,
          aesKey: base64EncryptedPW,
          fileName: current.name
        })
        current.encrypted = result
        current.status = true
        console.log(idx)
        console.log(fileCards)
        setFilecards([...fileCards, current])
        console.log(current)
      }
      reader.readAsArrayBuffer(target)
    }
  }
  return (
    <Fade in={props.status == 1} style={{transitionDelay: `400ms`}} unmountOnExit>
      <Paper sx={{my: 5, p: 2}} elevation={12}>
        <p>暗号化</p>
        <Box
          component="form"
          noValidate
          autoComplete="off"
        >
          <Alert severity="info" sx={{my: 2}}>
            暗号化したいファイルを選択してください
          </Alert>
          <Button
            component="label"
            variant="contained"
          >
            読み込み
            <input
              type="file"
              style={{
                opacity: 0,
                position: 'absolute'
              }}
              onChange={loadHandler}
            />
          </Button>
          <List sx={{my: 2, mx: 'auto', maxWidth: 1000}}>
            <TransitionGroup>
              {fileCards.map(file => (
                <Collapse key={file.name}>
                  <Card sx={{my: 2}} variant="outlined" key={file.name}>
                    <CardContent>
                      <p>{file.name}</p>
                      <Typography sx={{mb: 1.5}} color="text.secondary">
                        {file.status ? '暗号化完了' : '処理中'}
                      </Typography>
                    </CardContent>
                    <CardActions>
                      <LoadingButton loading={!file.status} variant="contained" onClick={() => {download(file)}}>ダウンロード</LoadingButton>
                    </CardActions>
                  </Card>
                </Collapse>
              ))}
            </TransitionGroup>
          </List>
        </Box>
      </Paper>
    </Fade>
  )
}

const Encrypt: NextPage = () => {
  const [status, setStatus] = useState(0)
  const [pass, setPass] = useState("")
  const steps = [
    '暗号化キー読み込み',
    '暗号化',
  ];
  return (
    <>
      <Container sx={{my: 3}} maxWidth="lg">
        <Typography variant="h5" component="h1">
          暗号化
        </Typography>
        <Box sx={{width: '100%', my: 2}}>
          <Stepper activeStep={status} alternativeLabel>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>
        </Box>
        <Step1 setStatus={setStatus} status={status}/>
        <Step2 setStatus={setStatus} status={status}/>
      </Container>
    </>
  )
}

export default Encrypt
