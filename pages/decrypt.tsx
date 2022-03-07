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
import * as crypto from "crypto";

interface Props {
  status: number,
  setStatus: (enable: number) => void
}

let priKey: CryptoKey
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
          keyObj,
          {
            name: "RSA-OAEP",
            hash: {name: "SHA-256"},
          },
          false,
          ["decrypt"]
        )
          .then(function (key) {
            priKey = key
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
        <p>復号化キー読み込み</p>
        <Box
          component="form"
          noValidate
          autoComplete="off"
        >
          <Alert severity="info" sx={{my: 2}}>
            事前に生成した復号化キーを読み込んでください。復号化キーは受信者が生成するのではなく送信者が生成してください。

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
  decrypted: ArrayBuffer | undefined,
  encrypted: {
    data: string,
    aesKey: string,
    fileName: string
  },
  status: boolean
  name: string
}
const download = (file:Ifile) => {
  const fileName = file.encrypted.fileName;
  if (file.decrypted !== void 0) {
    const data = new Blob([file.decrypted], { type: 'text/json' });
    const jsonURL = window.URL.createObjectURL(data);
    const link = document.createElement('a');
    document.body.appendChild(link);
    link.href = jsonURL;
    link.setAttribute('download', fileName);
    link.click();
    document.body.removeChild(link);
  }
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

function decryptKey(encryptedAESKEY: string, privateKey: CryptoKey): Promise<CryptoKey> {
  return new Promise<CryptoKey>((res,rej) => {
    const encryptedBuffer:ArrayBuffer = base64url.toBuffer(encryptedAESKEY)
    console.log(encryptedBuffer)
    window.crypto.subtle.decrypt(
      {
        name: "RSA-OAEP",
        //label: Uint8Array([...]) //optional
      },
      privateKey, //from generateKey or importKey above
      encryptedBuffer //ArrayBuffer of the data
    )
      .then(function(decrypted){
        // @ts-ignore
        const raw = String.fromCharCode.apply("", new Uint16Array(decrypted))
        window.crypto.subtle.importKey(
          "jwk", //can be "jwk" or "raw"
          JSON.parse(raw),
          {   //this is the algorithm options
            name: "AES-CBC",
          },
          false, //whether the key is extractable (i.e. can be used in exportKey)
          ["encrypt", "decrypt"] //can be "encrypt", "decrypt", "wrapKey", or "unwrapKey"
        )
          .then(function(key){
            //returns the symmetric key
            res(key)
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

function decryptData (encryptedData: string, AESKEY: CryptoKey): Promise<ArrayBuffer> {
  const data = base64url.toBuffer(encryptedData)
  console.log(data)
  return new Promise<ArrayBuffer>((res,rej) => {
    console.log('START')
    window.crypto.subtle.decrypt(
      {
        name: "AES-CBC",
        iv: new ArrayBuffer(16), //The initialization vector you used to encrypt
      },
      AESKEY, //from generateKey or importKey above
      data //ArrayBuffer of the data
    )
      .then(function(decrypted){
        //returns an ArrayBuffer containing the decrypted data
        res(decrypted)
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
        const raw = reader.result as string
        const current: Ifile = {
          encrypted: JSON.parse(raw),
          decrypted: void 0,
          status: false,
          name: target.name
        }

        setFilecards([...fileCards, current])

        //AESKEY復号化
        const encryptedAESKEY = current.encrypted.aesKey
        const AESKEY = await decryptKey(encryptedAESKEY, priKey)

        //元データ復号化
        const encryptedData = current.encrypted.data
        const data = await decryptData(encryptedData, AESKEY)
        current.decrypted = data
        current.status = true
        setFilecards([...fileCards, current])
      }
      reader.readAsText(target)
    }
  }
  return (
    <Fade in={props.status == 1} style={{transitionDelay: `400ms`}} unmountOnExit>
      <Paper sx={{my: 5, p: 2}} elevation={12}>
        <p>復号化</p>
        <Box
          component="form"
          noValidate
          autoComplete="off"
        >
          <Alert severity="info" sx={{my: 2}}>
            復号化したいファイルを選択してください
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
              accept=".encrypted"
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
                        {file.status ? '復号化完了' : '処理中'}
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

const Decrypt: NextPage = () => {
  const [status, setStatus] = useState(0)
  const [pass, setPass] = useState("")
  const steps = [
    '復号化キー読み込み',
    '復号化',
  ];
  return (
    <>
      <Container sx={{my: 3}} maxWidth="lg">
        <Typography variant="h5" component="h1">
          復号化
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

export default Decrypt
