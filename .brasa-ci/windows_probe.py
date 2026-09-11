from pathlib import Path
import ctypes as C,struct,json,sys,time
R=Path('brasa').resolve();P=C.POINTER;V=C.c_void_p;I=C.c_int32;U=C.c_uint32
module=R/'dist/windows/BRASA.vst3/Contents/x86_64-win/BRASA.vst3'
lib=C.WinDLL(str(module));lib.InitDll.restype=C.c_bool;print('InitDll',lib.InitDll(),flush=True)
lib.GetPluginFactory.restype=V;f=lib.GetPluginFactory()
def call(o,n,t,a,*v):
 vt=C.cast(o,P(P(V))).contents;return C.WINFUNCTYPE(t,V,*a)(vt[n])(o,*v)
def uid(a,b,c,d):return C.create_string_buffer(struct.pack('<IHH',a,b>>16,b&65535)+struct.pack('>II',c,d))
class Info(C.Structure):_fields_=[('cid',C.c_ubyte*16),('cardinality',I),('category',C.c_char*32),('name',C.c_char*64)]
print('classes',call(f,4,I,[]),flush=True)
for title,args in [('Factory',(0x7a4d811c,0x52114a1f,0xaed9d2ee,0x0b43bf9f)),('Factory2',(0x0007b650,0xf24b4c0b,0xa464edb9,0xf00b2abb))]:
 o=V();result=call(f,0,I,[V,P(V)],C.cast(uid(*args),V),C.byref(o));print(title,result,bool(o),flush=True)
 if o:call(o,2,U,[])
info=Info();assert call(f,5,I,[I,P(Info)],0,C.byref(info))==0
print('class',info.name,info.category,bytes(info.cid).hex(),flush=True)
c=V();print('before component creation',flush=True)
r=call(f,6,I,[V,V,P(V)],C.cast(info.cid,V),C.cast(uid(0xe831ff31,0xf2d54301,0x928ebbee,0x25697802),V),C.byref(c));print('component',r,bool(c),flush=True)
if c:
 print('initialize',call(c,3,I,[V],None),flush=True)
 print('audio buses',call(c,7,I,[I,I],0,1),flush=True)
 print('setActive',call(c,11,I,[C.c_uint8],1),flush=True)
 print('terminate',call(c,4,I,[]),flush=True);call(c,2,U,[])
call(f,2,U,[])
from pedalboard import load_plugin
results=[]
for path in [module.parents[2],module]:
 try:
  p=load_plugin(str(path));results.append({'path':str(path),'loaded':True,'parameters':len(p.parameters),'is_instrument':p.is_instrument});del p
 except Exception as e:results.append({'path':str(path),'loaded':False,'error':str(e)})
 print(results[-1],flush=True)
(R/'docs/evidence/windows-probe.json').write_text(json.dumps(results,indent=2))
