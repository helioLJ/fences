import './App.css';
import React, { useState, useEffect, FC } from 'react';
import mermaid from 'mermaid';
import ParentSize from '@visx/responsive/lib/components/ParentSize';
import { Diagram } from './Diagram.tsx';
import { Textarea } from "./components/ui/textarea"
import { Label } from "./components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./components/ui/select"
import {
  Menubar,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarSeparator,
  MenubarShortcut,
  MenubarTrigger,
} from "./components/ui/menubar.tsx"
import { FrameIcon, HamburgerMenuIcon } from "@radix-ui/react-icons"

import { Button } from "./components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "./components/ui/card"
import { Checkbox } from "./components/ui/checkbox"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./components/ui/dropdown-menu"
import { Input } from "./components/ui/input"
import { Sheet, SheetContent, SheetTrigger } from "./components/ui/sheet"
import { Badge } from "./components/ui/badge"

interface TreeNode {
  name: string;
  children: TreeNode[];
  isExpanded: boolean;
}

const traverseTree = (node: TreeNode, targetName: string): TreeNode | undefined => {
  if (node !== undefined && node.name === targetName) {
    return node;
  }

  for (const cki of node.children) {
    const res = traverseTree(cki, targetName);
    if (res) return res;
  }
  return undefined;
};

function findMatchingSpec(spec: any, endpointName: string): any {
  var reversedEndpointName = '';
  var open = false;
  for (let i = 0; i < endpointName.length -1; ++i) {
    if (endpointName[i] === '\'') {
      reversedEndpointName += open ? '}' : '{';
      open = !open;
      continue;
    }
    reversedEndpointName += endpointName[i];
  }
  
  var res = undefined;
  Object.keys(spec['spec']['paths']).forEach((path: any) => {
    if (path === reversedEndpointName) {
      console.log('found', spec['spec']['paths'][path]);
      res = [spec['spec']['paths'][path], path];
    }
  });

  return res;
}

function parseSpec(spec: any): any {
  var supportedVerbs = Object.keys(spec[0]);

  return {
    'spec': spec[0],
    'verbs': supportedVerbs,
    'path': spec[1],
  }
}


const App: FC = () => {
  const [spec, setSpec] = useState<string | null>(null);
  const [info, setInfo] = useState<any | null>(null);
  const [tree, setTree] = useState<TreeNode>({ name: 'root', children: [], isExpanded: false });
  const [selectedEndpoint, setSelectedEndpoint] = useState<string | null>(null);
  const [selectedEndpointSpec, setSelectedEndpointSpec] = useState<any | null>(null);

  useEffect(() => {
    fetch('http://localhost:5000/info')
      .then((response) => response.json())
      .then((json) => {
        setSpec(json['diagram']);
        setInfo(json)
      })
      .catch((error) => console.error(error));
  }, []);

  useEffect(() => { 
    if(selectedEndpoint===null) return;
    var temp = findMatchingSpec(info, selectedEndpoint);
    setSelectedEndpointSpec(parseSpec(temp));
  }, [selectedEndpoint, info]);

  useEffect(() => {
    if (spec == null) return;

    let tempTree: TreeNode = { name: 'root', children: [], isExpanded: false };

    const buildGraph = async () => {
      await mermaid.parse(spec);
      const parser: any = (await mermaid.mermaidAPI.getDiagramFromText(spec)).getParser()
      const parser_yy = parser.yy;
      console.log(parser_yy);

      const vertices = parser_yy.getVertices();
      const edges = parser_yy.getEdges();

      for (const link of edges) {
        const parent = traverseTree(tempTree, link.start);
        if (parent !== undefined) {
          parent.children.push({ name: link.end, children: [], isExpanded: false });
        } else {
          tempTree.children.push({
            name: link.start,
            children: [
              {
                name: link.end,
                children: [],
                isExpanded: false,
              },
            ],
            isExpanded: false
          });
        }
      }
      setTree(tempTree);
    };

    buildGraph();
  }, [spec]);

  return (
    <div className="flex min-h-screen w-full flex-col">
      <header className="sticky top-0 flex h-16 items-center gap-4 border-b bg-background px-4 md:px-6">
        <nav className="hidden flex-col gap-6 text-lg font-medium md:flex md:flex-row md:items-center md:gap-5 md:text-sm lg:gap-6">
          <a
              href="/"
              className="flex items-center gap-2 text-lg font-semibold md:text-base"
            >
              <FrameIcon className="h-6 w-6" />
              <span className="sr-only">Fences</span>
            </a>
            <a
              href="/"
              className="text-muted-foreground transition-colors hover:text-foreground"
            >
              {info ? info['title'] : 'Loading...'}
            </a>
        </nav>
        <Sheet>
          <SheetTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className="shrink-0 md:hidden"
            >
              <HamburgerMenuIcon className="h-6 w-6" />
              <span className="sr-only">Toggle navigation menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left">
            <nav className="grid gap-6 text-lg font-medium">
              <a
                href="#"
                className="flex items-center gap-2 text-lg font-semibold"
              >
                <HamburgerMenuIcon className="h-6 w-6" />
                <span className="sr-only">Fences</span>
              </a>
              <a
                href="#"
                className="text-muted-foreground hover:text-foreground"
              >
                {info ? info['title'] : 'Loading...'}
              </a>
            </nav>
          </SheetContent>
        </Sheet>
      </header>
      <main className="flex min-h-[calc(100vh_-_theme(spacing.16))] flex-1 flex-col gap-4 bg-muted/40 p-4 md:gap-8 md:p-10">
        <div className="mx-auto grid w-full max-w-6xl items-start gap-6 md:grid-cols-[180px_1fr] lg:grid-cols-[250px_1fr]">
          <div className="flex gap-2">
            <div className='flex-1'>
              <Card
              className="xl:col-span-2" x-chunk="dashboard-01-chunk-4"
              >
                <CardHeader className="flex flex-row items-center">
                  <div className="grid gap-2">
                    <CardTitle>Endpoints Diagram</CardTitle>
                    <CardDescription>
                      AI Generated visual representation on the endpoints.
                    </CardDescription>
                  </div>
                </CardHeader>
                <CardContent>
                  {/* todo: fix this parentsize */}
                  <ParentSize>{({ width, height }) => <Diagram width={1000} height={1000} data={tree} setSelectedEndpoint={setSelectedEndpoint}/>}</ParentSize>
                </CardContent>
              </Card>
            </div>
            <div className='flex-1 min-w-[300px]'>
              <Card
              className="xl:col-span-2" x-chunk="dashboard-01-chunk-4"
              >
                <CardHeader className="flex flex-row items-center">
                  <div className="grid gap-2">
                    <CardTitle>Current Request</CardTitle>
                    <CardDescription>
                      Select an endpoint on the diagram to start a request.
                    </CardDescription>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-2">
                    {
                      (selectedEndpoint && selectedEndpointSpec)?
                      <>
                      <Badge>{selectedEndpointSpec['path']}</Badge>
                      {/* todo: fix this, we need to completly change the select instance, the select/defaul value bugs out when we change endpoints */}
                      <Select defaultValue={selectedEndpointSpec['verbs'][0]}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select an http verb" />
                        </SelectTrigger>
                        <SelectContent>
                          {selectedEndpointSpec['verbs'].map((el: string) => <SelectItem key={el} value={el}>{el.toUpperCase()}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <p className="font-medium">Request Body</p>
                      <Textarea />
                      {/* <p>{JSON.stringify(selectedEndpointSpec)}</p> */}
                      <Button>Send Request</Button>
                      </> :
                      <Label>Click an endpoint to select it.</Label>
                    }
                  </div>
                </CardContent>
              </Card>
            </div>
            <div className='flex-1'>
              <Card
              className="xl:col-span-2" x-chunk="dashboard-01-chunk-4"
              >
                <CardHeader className="flex flex-row items-center">
                  <div className="grid gap-2">
                    <CardTitle>Data collected</CardTitle>
                    <CardDescription>
                      These are the data we collected from requests/responses you made. AI might use them to help you make future requests.
                    </CardDescription>
                  </div>
                </CardHeader>
                <CardContent>
                  <Label>No data collected yet.</Label>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;
