// ADL SCORM.JS modified/crunched.


// Define exception/error codes
var _NoError = {"code":"0","string":"No Error","diagnostic":"No Error"};;
var _GeneralException = {"code":"101","string":"General Exception","diagnostic":"General Exception"};
var _AlreadyInitialized = {"code":"103","string":"Already Initialized","diagnostic":"Already Initialized"};

// Initialized state of the content; default false
var initialized = false;

// Handle to the SCORM  API instance
var apiHandle = null;

// Global for SCORM version; Default 2004 and set during initialize
var versionIsSCORM2004 = true;

function doInitialize(isScorm2004)
{
	versionIsSCORM2004 = isScorm2004 == "True";
	console.log("doInitialize:") ;
	if (initialized) return "true";
   
   var api = getAPIHandle();
   if (api == null)
   {
      console.log("Unable to locate the LMS's API Implementation.\nInitialize was not successful.");
      return "false";
   }

   // switch Initialize method based on SCORM version
   if (versionIsSCORM2004 == true)
   {
      var result = api.Initialize("");
   }
   else
   {
      var result = api.LMSInitialize("");
   }
	
   if (result == null || result.toString() != "true")
   {
      var err = ErrorHandler();
      console.log("Initialize failed with error code: " + err.code);
   }
   else
   {
      initialized = true;
   }

   return result.toString();
}

function doTerminate()
{
   console.log("doTerminate:") ;
   if (!initialized) return "false";
   
   var api = getAPIHandle();
   if (api == null)
   {
      return "false";
   }
   else
   {
      // switch Terminate/LMSFinish method based on SCORM version
	  if (versionIsSCORM2004 == true)
	  {
	     var result = api.Terminate("");
	  }
	  else
	  {
	     var result = api.LMSFinish("");
	  }	  
	  
      if (result == null || result.toString() != "true")
      {
         var err = ErrorHandler();
      }
   }
   initialized = false;
   return result.toString();
}

function doGetValue(identifier,objectname,callbackname)
{ 
   // JP TODO - temp hack to get rid of the value for strings and associated language data model elements
   var dotBindingName = identifier.replace(".Value", "");
   
   var api = getAPIHandle();
   var result = "";
   if (api == null)
   {
      console.log("Unable to locate the LMS's API Implementation.\nGetValue was not successful.");
   }
   else if (!initialized && ! doInitialize())
   {
      var err = ErrorHandler();
      console.log("GetValue failed - Could not initialize communication with the LMS - error code: " + err.code);
   }
   else
   {
      // switch Get method based on SCORM version
	  if (versionIsSCORM2004 == true)
	  {
	     result = api.GetValue(dotBindingName);
	  }
	  else
	  {
	     result = api.LMSGetValue(dotBindingName);
	  }
      
      var error = ErrorHandler();
	  
      if (error.code != _NoError.code)
      {
		 return "false";
      }
   }
   return result;
}

function doSetValue(identifier,value,objectname,callbackname)
{
   // JP TODO - temp hack to get rid of the value for strings and associated language data model elements
   var dotBindingName = identifier.replace(".Value", "");

   console.log("doSetValue:") ;
   console.log("dotBindingName:" + dotBindingName) ;
   console.log("value:" + value ) ;
   
   // Hack for negative numbers.
   // We send only the first char ("-" for negative numbers), so it creates an error in the LMSSetValue call below.
   if (value == "-")
	   value = "0";
   
   var api = getAPIHandle();
   var result = "false";
   if (api == null)
   {
		console.log("Unable to locate the LMS's API Implementation.\nSetValue was not successful.");
   }
   else if (!initialized && !doInitialize())
   {
		var error = ErrorHandler();
		console.log("SetValue failed - Could not initialize communication with the LMS - error code: " + error.code);
   }
   else
   {
      // switch set method based on SCORM version
	  if (versionIsSCORM2004)
	  {
	    result = api.SetValue(dotBindingName, value);
	  }
	  else
	  {
	    result = api.LMSSetValue(dotBindingName, value);
	  }
	  
      if (result == null || result.toString() != "true")
      {
		var err = ErrorHandler();
		return "false";
      }
	  else
	  {
		return "true";
	  }
   }
   return "false";
}

function doCommit()
{
   var api = getAPIHandle();
   var result = "false";
   if (api == null)
   {
      console.log("Unable to locate the LMS's API Implementation.\nCommit was not successful.");
   }
   else if (!initialized && ! doInitialize())
   {
      var error = ErrorHandler();
      console.log("Commit failed - Could not initialize communication with the LMS - error code: " + error.code);
   }
   else
   {
      // switch method based on SCORM Version
	  if (versionIsSCORM2004)
	  {
	     result = api.Commit("");
	  }
	  else
	  {
	     result = api.LMSCommit("");
	  }
	  
      if (result != "true")
      {
         var err = ErrorHandler();
         console.log("Commit failed - error code: " + err.code);
      }
	  else
	  {
		console.log("commit success");
	  }
   }

   return result;
}

function ErrorHandler()
{
   var error = {"code":_NoError.code, "string":_NoError.string, "diagnostic":_NoError.diagnostic};
   var api = getAPIHandle();
   if (api == null)
   {
      error.code = _GeneralException.code;
      error.string = _GeneralException.string;
      error.diagnostic = "Unable to locate the LMS's API Implementation. Cannot determine LMS error code.";
      return error;
   }

   // check for errors caused by or from the LMS; switch based on SCORM version
   if (versionIsSCORM2004 == true)
   {
      error.code = api.GetLastError().toString();
   }
   else
   {
      error.code = api.LMSGetLastError().toString();
   }
   
   if (error.code != _NoError.code)
   {
      // an error was encountered so display the error description
	  if (versionIsSCORM2004 == true)
	  {
         error.string = api.GetErrorString(error.code);
         error.diagnostic = api.GetDiagnostic("");
      }
	  else
	  {
	     error.string = api.LMSGetErrorString(error.code);
         error.diagnostic = api.LMSGetDiagnostic("");
	  }
   }

   return error;
}

function getAPIHandle()
{
   if (apiHandle == null)
   {
      apiHandle = getAPI();
   }

   return apiHandle;
}

function findAPI(win)
{
   var findAPITries = 0;
   while ((win.API_1484_11 == null) && (win.parent != null) && (win.parent != win) && (win.API == null))
   {
      findAPITries++;
      
      if (findAPITries > 500) 
      {
		 console.log("Error finding API -- too deeply nested.");
         return null;
      }
      
      win = win.parent;
   }
   
   console.log("WIN : " + win);
   console.log("WINAPI : " + win.API);
   console.log("WINAPI_1484_11 : " + win.API_1484_11);
   
   
  console.log("WINAPI_1484_11 : " + versionIsSCORM2004);
   // return SCORM 2004 or SCORM Version 1.2 API - whichever is found or null
   
   if (versionIsSCORM2004 == false)
   {
	  return win.API;
   }
   else
   {
	  return win.API_1484_11;
   }
   
}

function getAPI()
{
   var theAPI = findAPI(window);
   if ((theAPI == null || theAPI == "undefined") && (window.parent.opener != null) && (typeof(window.parent.opener) != "undefined"))
   {
      theAPI = findAPI(window.parent.opener);
   }
   if (theAPI == null)
   {
		console.log((window.opener));
		console.log((window.parent.opener));
		console.log("Unable to find an API adapter");
   }
  
   return theAPI
}


